// @ts-check
/// <reference path='./index.d.ts'/>
import Sprite from './sprite'
import defaultTrexImg from './images/buho_pie.png'
import tRexFistFrameImg from './images/buho_pie.png'
import tRexDuck1Img from './images/buho_duck1.png'
import tRexDuck2Img from './images/buho_duck2.png'
import tRexCrashImg from './images/buho_crash.png'
import jumpSound from './sounds/button-press.mp3'
import hitSound from './sounds/hit.mp3'

/**
 * trex status enum
 * @readonly
 */
const STATUS = Object.freeze({
    START: 'START',
    JUMP: 'JUMP',
    DUCK_1: 'DUCK_1',
    RUN_1: 'RUN_1',
    DUCK_2: 'DUCK_2',
    RUN_2: 'RUN_2',
    CRASH: 'CRASH',
})

/**
 * @extends Sprite
 */
class Trex extends Sprite {
    /** @type {number} */
    jumpVelocity = 0
    /** @type {number} */
    groundY
    /** @type {string} */
    status
    /** @type {number} */
    duckTime = 0
    /** @type {Map<string, HTMLAudioElement>} */
    audioMap = new Map()

    /**
     * object config
     * @type {{IMG_SRC: Array | string, STATUS: object, DUCK_INTERVAL: number, X_POS: number, Y_POS: number, GROUND_HEIGHT: number, GRAVITY: number, JUMP_SPEED: number, SPEED: number, SOUNDS: object}}
     */
    config = {
        IMG_SRC: defaultTrexImg,
        STATUS: {
            START: { img: tRexFistFrameImg },
            JUMP: { img: defaultTrexImg },
            DUCK_1: { img: tRexDuck1Img },
            RUN_1: { img: defaultTrexImg },
            DUCK_2: { img: tRexDuck2Img },
            RUN_2: { img: defaultTrexImg },
            CRASH: { img: tRexCrashImg },
        },
        DUCK_INTERVAL: 0.1,
        X_POS: 100,
        Y_POS: null,
        GROUND_HEIGHT: 70,
        GRAVITY: 1600,
        JUMP_SPEED: 600,
        SPEED: 50, // move when you start the game for the first time
        SOUNDS: {
            JUMP: jumpSound,
            HIT: hitSound,
        },
    }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} [options={}]
     * @constructs Trex
     */
    constructor(canvas, options = {}) {
        super(canvas, options)
        this.config = {
            ...this.config,
            ...options,
        }
        this.loadSounds()
        this.xPos = 0
        this.groundY =
            this.canvas.height - this.img.height - this.config.GROUND_HEIGHT
        this.yPos = this.config.Y_POS || this.groundY
        this.status = STATUS.START
    }

    /**
     * update position
     * @param {number} [deltaTime = 1 / 16]
     * @override
     */
    update(deltaTime = 1 / 16) {
        // move at the beginning of the first game
        if (this.status !== STATUS.JUMP && this.xPos < this.config.X_POS) {
            this.xPos += this.config.SPEED * deltaTime
            if (this.xPos > this.config.X_POS) {
                this.xPos = this.config.X_POS
            }
        }
        // jump
        if (this.status === STATUS.JUMP) {
            this.yPos -= this.jumpVelocity * deltaTime
            this.jumpVelocity -= this.config.GRAVITY * deltaTime
        }
        // Landing
        if (this.yPos > this.groundY) {
            this.yPos = this.groundY
            this.jumpVelocity = 0
            this.status = STATUS.DUCK_1
            this.duckTime = 0
        }
        // duck animation cycle
        this.duckTime += deltaTime
        if (this.duckTime > this.config.DUCK_INTERVAL) {
            this.switchDuck()
            this.duckTime = 0
        }

        this.draw()
    }

    switchDuck() {
        // Cycle: DUCK_1 -> RUN_1 -> DUCK_2 -> RUN_2 -> DUCK_1
        if (this.status === STATUS.DUCK_1) {
            this.status = STATUS.RUN_1
            return
        }
        if (this.status === STATUS.RUN_1) {
            this.status = STATUS.DUCK_2
            return
        }
        if (this.status === STATUS.DUCK_2) {
            this.status = STATUS.RUN_2
            return
        }
        if (this.status === STATUS.RUN_2) {
            this.status = STATUS.DUCK_1
            return
        }
    }

    /**
     * @param {String | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap} [img = this.config.STATUS[this.status].img]
     * @override
     */
    draw(img = this.config.STATUS[this.status].img) {
        super.draw(img)
    }

    /**
     * @param {number} [speed=this.config.JUMP_SPEED]
     */
    jump(speed = this.config.JUMP_SPEED) {
        if (this.status === STATUS.JUMP || this.status === STATUS.CRASH) {
            return
        }
        this.status = STATUS.JUMP
        this.jumpVelocity = speed
        this.playSound(this.config.SOUNDS.JUMP)
    }

    crash() {
        this.status = STATUS.CRASH
        // landing
        this.jumpVelocity = -1 * Math.abs(this.jumpVelocity)
        this.playSound(this.config.SOUNDS.HIT)
    }

    start() {
        this.status = STATUS.JUMP
    }

    loadSounds() {
        Object.values(this.config.SOUNDS)
            .forEach(src => {
                const audio = new Audio(src)
                this.audioMap.set(src, audio)
            })
    }

    /**
     * play audio
     * @param {string} sound
     */
    playSound(sound) {
        const audio = this.audioMap.get(sound)
        // HTMLMediaElement.readyState
        if (!audio || audio.readyState !== 4) {
            return
        }
        audio.play()
    }
}

export default Trex