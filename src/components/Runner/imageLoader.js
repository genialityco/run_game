// @ts-check
/// <reference path='./index.d.ts'/>
import tRexImg from './images/buho_pie.png'
import tRexFistFrameImg from './images/buho_pie.png'
import tRexDuck1Img from './images/buho_duck1.png'
import tRexDuck2Img from './images/buho_duck2.png'
import tRexCrashImg from './images/buho_crash.png'

import cloudImg from './images/nube1.png'
import groundImg from './images/ground2.png'
import cactusSmallImg from './images/cactus4.png'
import cactusLargeImg from './images/cactus3.png'
import restartButtonImg from './images/repeat.png'
import gameoverTextImg from './images/game_over2.png'
import scoreNumberImg from './images/score_number.png'

/**
 * URL to load
 * @type {string[]} img url array
 */
const imageArray = [
    cloudImg,
    tRexImg,
    tRexFistFrameImg,
    groundImg,
    cactusSmallImg,
    cactusLargeImg,
    tRexDuck1Img,
    tRexDuck2Img,
    tRexCrashImg,
    restartButtonImg,
    gameoverTextImg,
    scoreNumberImg,
]

/**
 * @type {Map<string, HTMLImageElement>} 
 */
const imageMap = new Map()

/**
 * @type {promise[]}
 */
const promiseArray = imageArray.map(imgUrl => {
    const promise = new Promise((resolve, reject) => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
            imageMap.set(imgUrl, img)
            resolve()
        }
        img.src = imgUrl
    })
    return promise
})

export function loadImages() {
    return Promise.all(promiseArray)
}

/**
 * load img from imageMap
 * @param {string} src img src
 * @return {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap}
 */
export default function getImg(src) {
    const img = imageMap.get(src)
    if (!img) {
        throw new Error(`load image fail! IMG_SRC: ${src}`)
    }
    return img
}
