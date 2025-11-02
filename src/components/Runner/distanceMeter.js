class DistanceMeter {
    /** @type {!HTMLCanvasElement} */
    canvas
    /** @type {!CanvasRenderingContext2D} */
    get canvasCtx() {
        return this.canvas.getContext('2d')
    }
    /** @type {number} */
    highestScore = 0
    /** @type {number} */
    score = 0

    config = {
        RATIO: 0.05,
        MAX_DISTANCE_UNITS: 5,
        Y_POS: 20,
        FONT_SIZE: 30,
        FONT_FAMILY: 'serif',
        TEXT_COLOR: '#000',
        TEXT_ALPHA: 0.8,
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} [options={}]
     * @constructs DistanceMeter
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas
        this.config = {
            ...this.config,
            ...options,
        }
    }

    /**
     * update score
     * @param {number} num score
     */
    update(num) {
        this.score = Math.floor(num * this.config.RATIO)
        this.draw()
    }

    updateHighScore() {
        if (this.score > this.highestScore) {
            this.highestScore = this.score
        }
        this.draw()
    }

    /**
     * draw score on (x, y)
     * @param {number | string} score
     * @param {number} x xPos
     * @param {number} y yPos
     */
    drawScore(score = 0, x = 0, y = 0) {
        const scoreStr = score
            .toString()
            .padStart(this.config.MAX_DISTANCE_UNITS, '0')

        this.canvasCtx.save()
        this.canvasCtx.globalAlpha = this.config.TEXT_ALPHA
        this.canvasCtx.font = `${this.config.FONT_SIZE}px ${this.config.FONT_FAMILY}`
        this.canvasCtx.fillStyle = this.config.TEXT_COLOR
        this.canvasCtx.textAlign = 'right'
        this.canvasCtx.textBaseline = 'top'
        this.canvasCtx.fillText(scoreStr, x, y)
        this.canvasCtx.restore()
    }

    /**
     * draw 'HI' text
     * @param {number} x xPos
     * @param {number} y yPos
     */
    drawHi(x, y) {
        this.canvasCtx.save()
        this.canvasCtx.globalAlpha = this.config.TEXT_ALPHA
        this.canvasCtx.font = `${this.config.FONT_SIZE}px ${this.config.FONT_FAMILY}`
        this.canvasCtx.fillStyle = this.config.TEXT_COLOR
        this.canvasCtx.textAlign = 'right'
        this.canvasCtx.textBaseline = 'top'
        this.canvasCtx.fillText('HI', x, y)
        this.canvasCtx.restore()
    }

    drawHighestScore(score, x = 0, y = 0) {
        // Measure text width for proper spacing
        this.canvasCtx.save()
        this.canvasCtx.font = `${this.config.FONT_SIZE}px ${this.config.FONT_FAMILY}`
        const hiWidth = this.canvasCtx.measureText('HI ').width
        this.canvasCtx.restore()

        this.drawHi(x, y)
        this.drawScore(score, x + hiWidth + 40, y)
    }

    draw() {
        // overflow
        if (this.score.toString().length > this.config.MAX_DISTANCE_UNITS) {
            this.score = 10 ** this.config.MAX_DISTANCE_UNITS - 1
        }

        // Measure text widths for positioning
        this.canvasCtx.save()
        this.canvasCtx.font = `${this.config.FONT_SIZE}px ${this.config.FONT_FAMILY}`
        const scoreWidth = this.canvasCtx.measureText('00000').width
        this.canvasCtx.restore()

        const padding = 20

        if (this.highestScore > 0) {
            this.drawHighestScore(
                this.highestScore,
                this.canvas.width - scoreWidth - padding * 2 - 80,
                this.config.Y_POS
            )
        }
        
        this.drawScore(
            this.score, 
            this.canvas.width - padding, 
            this.config.Y_POS
        )
    }

    reset() {
        this.highestScore = 0
    }
}

export default DistanceMeter