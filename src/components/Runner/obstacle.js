// @ts-check
/// <reference path='./index.d.ts'/>
import Sprite from './sprite'
import cactusSmallImg from './images/cactus4.png'
import cactusLargeImg from './images/cactus3.png'

class Obstacle extends Sprite {
    /** @type {number} */
    groundY

    /**
     * object config
     * @type {{IMG_SRC: Array | string, X_POS: number, Y_POS: number, GROUND_HEIGHT: number, HITBOX_REDUCTION: object}}
     */
    config = {
        IMG_SRC: [cactusSmallImg, cactusLargeImg],
        X_POS: null,
        Y_POS: null,
        GROUND_HEIGHT: 70,
        // Configuración del hitbox reducido
        HITBOX_REDUCTION: {
            width: 0.6,    // 60% del ancho (reduce 40%)
            height: 0.7,   // 70% del alto (reduce 30%)
            offsetX: 0.2,  // 20% de offset horizontal (centra el hitbox)
            offsetY: 0.15  // 15% de offset vertical (desde arriba)
        }
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} [options={}]
     * @constructs Obstacle
     */
    constructor(canvas, options = {}) {
        super(canvas, options)
        this.config = {
            ...this.config,
            ...options,
        }
        this.xPos = this.config.X_POS || 0
        if (this.config.Y_POS && this.config.GROUND_HEIGHT) {
            throw new Error(
                'options \'Y_POS\' and \'GROUND_HEIGHT\' exist simultaneously'
            )
        }
        this.groundY =
            this.canvas.height - this.img.height - this.config.GROUND_HEIGHT
        this.yPos = this.config.Y_POS || this.groundY
        
        // Almacenar la configuración del hitbox
        this.hitboxReduction = this.config.HITBOX_REDUCTION
    }

    /**
     * Obtiene el hitbox reducido del obstáculo
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getHitbox() {
        const originalWidth = this.img.width
        const originalHeight = this.img.height
        
        return {
            x: this.xPos + (originalWidth * this.hitboxReduction.offsetX),
            y: this.yPos + (originalHeight * this.hitboxReduction.offsetY),
            width: originalWidth * this.hitboxReduction.width,
            height: originalHeight * this.hitboxReduction.height
        }
    }

    /**
     * Verifica colisión con el jugador usando el hitbox reducido
     * @param {object} player - objeto con propiedades xPos, yPos, img (con width/height)
     * @returns {boolean}
     */
    collidesWith(player) {
        const hitbox = this.getHitbox()
        const playerWidth = player.img ? player.img.width : player.width
        const playerHeight = player.img ? player.img.height : player.height
        
        return (
            player.xPos < hitbox.x + hitbox.width &&
            player.xPos + playerWidth > hitbox.x &&
            player.yPos < hitbox.y + hitbox.height &&
            player.yPos + playerHeight > hitbox.y
        )
    }

    /**
     * Dibuja el hitbox (útil para debugging)
     * Llama a este método en draw() para visualizar el hitbox
     */
    drawHitbox() {
        const hitbox = this.getHitbox()
        this.canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)'
        this.canvasCtx.lineWidth = 2
        this.canvasCtx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)
    }

    /**
     * update the obstacle position
     * @param {number} [deltaTime = 1 / 16]
     * @param {number} [speed=0]
     */
    update(deltaTime = 1 / 16, speed = 0) {
        this.xPos -= speed * deltaTime
        super.update()
        
        // Descomentar la siguiente línea para ver el hitbox mientras desarrollas:
        // this.drawHitbox()
    }
}

export default Obstacle