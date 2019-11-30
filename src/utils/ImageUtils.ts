import * as fs from 'fs'
import * as sharp from 'sharp'
import * as uuidv1 from 'uuid/v1'

export namespace ImageUtils {
    let tmpDir = 'tmp/'

    export function resizeImage_Base64(base64Data: string, format: string, resizeOptions?: { width: number, height: number }): string {
        // if (!fs.existsSync(tmpDir)) {
        //     fs.mkdirSync(tmpDir)
        // }

        // let tmpName = 'resize_tmp.' + format
        // fs.writeFileSync(tmpDir + tmpName, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })

        // let transform: sharp.SharpInstance = sharp()
        // if (resizeOptions) {
        //     transform.toFormat(format)
        //     transform.resize(resizeOptions.width, resizeOptions.height)
        // }
        
        // fs.createReadStream(tmpDir + tmpName)
        //     .pipe(transform)
        //     .pipe(fs.createWriteStream(filePath))
        return base64Data
    }
}
