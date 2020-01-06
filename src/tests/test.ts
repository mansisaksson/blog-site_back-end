import { ImageUtils } from './../utils/ImageUtils'
import * as fs from 'fs'

export async function runTests(): Promise<boolean> {
    let tmpDir = 'tmp/'
    //let base64str = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEU0OkArMjhobHEoPUPFEBIuO0L+AAC2FBZ2JyuNICOfGx7xAwTjCAlCNTvVDA1aLzQ3COjMAAAAVUlEQVQI12NgwAaCDSA0888GCItjn0szWGBJTVoGSCjWs8TleQCQYV95evdxkFT8Kpe0PLDi5WfKd4LUsN5zS1sKFolt8bwAZrCaGqNYJAgFDEpQAAAzmxafI4vZWwAAAABJRU5ErkJggg=="

    let base64str = fs.readFileSync(tmpDir + 'test_image1.png').toString('base64')

    let { base64Data, err } = await ImageUtils.formatImage_Base64(base64str, "png", { 
        width: 256, 
    })
    if (err) {
        return false
    }

    fs.writeFileSync(tmpDir + 'test.png', Buffer.from(base64Data, 'base64'), { encoding: 'binary' })
    
    return true
}