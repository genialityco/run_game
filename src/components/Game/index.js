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
            this.setState({ poseDetected: true });
            this.detectJump(results.poseLandmarks);
        } else {
            this.setState({ poseDetected: false });
        }
    }

    detectJump(landmarks) {
        if (!landmarks[27] || !landmarks[28] || !this.state.gameStarted) return;

        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        const currentY = (leftAnkle.y + rightAnkle.y) / 2;

        if (this.previousY !== null && !this.jumpCooldown) {
            const yDifference = this.previousY - currentY;
            
            if (yDifference > 0.08 && !this.isJumping) {
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
        const { gameStarted, poseDetected } = this.state;

        return (
            <div style={{ 
                width: '100%', 
                height: '100vh', 
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Video oculto */}
                <video
                    ref={this.videoRef}
                    style={{ display: 'none' }}
                    autoPlay
                    playsInline
                    muted
                />

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
                        className="logo"
                        style={{
                            maxWidth: '400px',
                            height: 'auto',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>

                {/* Indicador de detección */}
                {/* <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    padding: '10px 20px',
                    background: poseDetected ? '#27ae60' : '#e74c3c',
                    color: 'white',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                    {poseDetected ? '✓ Listo para saltar' : '⚠ Muévete para ser detectado'}
                </div> */}

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
                            🎮 INICIAR JUEGO
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

export default App;