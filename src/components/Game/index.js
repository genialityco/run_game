import React, { Component } from 'react';
import logoImage from '../Runner/images/LOGO_GEN.png';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            gameStarted: false,
            poseDetected: false,
        };
        this.videoRef = React.createRef();
        this.outerContainerEl = null;
        this.runner = null;
        this.pose = null;
        this.animationId = null;
        this.previousY = null;
        this.isJumping = false;
        this.jumpCooldown = false;
        this.state = {
            // ... tus estados existentes
            showCamera: true,  // por defecto visible
            // poseDetected, gameStarted, etc.
        };
    }
    

    componentDidMount() {
        this.initMediaPipe();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initMediaPipe() {
        try {
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');

            let attempts = 0;
            while (!window.Pose && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.Pose) {
                throw new Error('MediaPipe Pose no se cargó');
            }

            this.pose = new window.Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.pose.onResults(this.onPoseResults.bind(this));

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            if (this.videoRef.current) {
                this.videoRef.current.srcObject = stream;
                
                await new Promise((resolve) => {
                    this.videoRef.current.onloadedmetadata = () => {
                        this.videoRef.current.play();
                        resolve();
                    };
                });

                this.startCamera();
            }

        } catch (error) {
            console.error('Error al inicializar MediaPipe:', error);
        }
    }

    async initRunner() {
        if (!this.outerContainerEl) {
            console.error('outerContainerEl no está disponible');
            return;
        }
        
        const config = {
            id: 'runner',
            width: this.outerContainerEl.offsetWidth,
            height: this.outerContainerEl.offsetHeight,
        };
        
        try {
            // Importar Runner como named export desde ../Runner
            const { Runner } = await import('../Runner');
            
            if (!Runner) {
                throw new Error('No se pudo cargar Runner');
            }
            
            this.runner = new Runner(this.outerContainerEl, config);
            await this.runner.init();
            this.setState({ gameStarted: true });
            
        } catch (error) {
            console.error('Error al inicializar Runner:', error);
            alert('Error al cargar Runner:\n' + error.message);
        }
    }

    startCamera() {
        const sendFrame = async () => {
            if (!this.pose || !this.videoRef.current) {
                return;
            }

            try {
                await this.pose.send({ image: this.videoRef.current });
            } catch (error) {
                console.error('Error al procesar frame:', error);
            }

            this.animationId = requestAnimationFrame(sendFrame);
        };

        sendFrame();
    }

   onPoseResults(results) {
    if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;

        // Calcular promedio del eje X del cuerpo
        const avgX = landmarks.reduce((sum, lm) => sum + lm.x, 0) / landmarks.length;

        // Rango central permitido (ajústalo según cámara)
        const minX = 0.35;
        const maxX = 0.65;

        // Filtrar: solo aceptar persona si está en el centro
        if (avgX > minX && avgX < maxX) {
            this.setState({ poseDetected: true });
            this.detectJump(landmarks);
        } else {
            this.setState({ poseDetected: false });
        }
    } else {
        this.setState({ poseDetected: false });
    }
}

    detectJump(landmarks) {
        if (!landmarks[23] || !landmarks[24] || !this.state.gameStarted) return;
    
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const currentY = (leftHip.y + rightHip.y) / 2;
    
        if (this.previousY !== null && !this.jumpCooldown) {
            const yDifference = this.previousY - currentY;
            
            if (yDifference > 0.02 && !this.isJumping) {
                this.triggerJump();
                this.isJumping = true;
                this.jumpCooldown = true;
                
                setTimeout(() => {
                    this.jumpCooldown = false;
                    this.isJumping = false;
                }, 600);
            }
        }
    
        this.previousY = currentY;
    }

    triggerJump() {
        if (this.runner && this.runner.onAction) {
            this.runner.onAction();
            console.log('¡Salto detectado!');
        }
    }

    handleStartGame() {
        this.initRunner();
    }

    stopCamera() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.videoRef.current && this.videoRef.current.srcObject) {
            const tracks = this.videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoRef.current.srcObject = null;
        }

        if (this.pose) {
            this.pose.close();
            this.pose = null;
        }
    }

    componentWillUnmount() {
        this.stopCamera();
    }

    render() {
        const { gameStarted, poseDetected, showCamera } = this.state;
    
        return (
            <div style={{ 
                width: '100%', 
                height: '100vh', 
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Video de cámara (vista previa pequeña) */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: showCamera ? '20px' : '-300px', // oculto fuera de pantalla
                        width: '240px',
                        height: '180px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                        zIndex: 999,
                        transition: 'right 0.4s ease-in-out',
                        background: '#000'
                    }}
                >
                    <video
                        ref={this.videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)', // espejo (como en selfie)
                        }}
                    />
    
                    {/* Botón para ocultar/mostrar */}
                    <button
                        onClick={() => this.setState(prev => ({ showCamera: !prev.showCamera }))}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '32px',
                            height: '32px',
                            background: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            borderRadius: '50%',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                    >
                        {showCamera ? '✕' : '📷'}
                    </button>
    
                    {/* Indicador de detección en la cámara */}
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        padding: '4px 8px',
                        background: poseDetected ? 'rgba(39, 174, 96, 0.9)' : 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}>
                        {poseDetected ? '✓ Detectado' : 'Buscando...'}
                    </div>
                </div>
    
                {/* Logo central arriba */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000
                }}>
                    <img
                        src={logoImage}
                        alt="Logo"
                        style={{
                            maxWidth: '400px',
                            height: 'auto',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>
    
                {/* Área del juego */}
                <div
                    ref={(node) => { this.outerContainerEl = node; }}
                    className="runner-wrapper"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: "#c3b022",
                        backgroundImage: "linear-gradient(0deg,rgba(195, 176, 34, 1) 2%, rgba(195, 160, 34, 1) 39%, rgba(253, 125, 45, 1) 100%)",
                        position: 'relative'
                    }}
                >
                    {!gameStarted && (
                        <button
                            onClick={() => this.handleStartGame()}
                            style={{
                                padding: '20px 40px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                background: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.background = '#229954';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.background = '#27ae60';
                            }}
                        >
                            INICIAR JUEGO
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

export default App;
