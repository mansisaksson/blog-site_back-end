import * as fs from 'fs'
import * as sharp from 'sharp'

export namespace ImageUtils {
    export enum ImageStretchMethod {
        fill = 'fill',
        crop = 'crop'
    }
    
    export interface ImageFormating {
        width?: number
        height?: number
        imageStretchMethod?: ImageStretchMethod
        preserveAspectRatio?: boolean
        withoutEnlargement?: boolean
    }

    let tmpDir = 'tmp/'

    export async function formatImage_Base64(base64Data: string, newImageFormat: string, options?: ImageFormating): Promise<{ base64Data: string, err?: string }> {
        return new Promise<{ base64Data: string, err?: string }>((resolve) => {
            let validFormats = [
                'jpeg',
                'png'
            ]

            if (!validFormats.includes(newImageFormat)) {
                return { base64Data: "", err: "Invalid image format" }
            }

            let tmpName = 'resize_tmp.' + newImageFormat

            try {
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir)
                }

                fs.writeFileSync(tmpDir + tmpName, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })
            } catch (error) {
                console.log(error)
                return { base64Data: "", err: "Failed to write temporary work file" }
            }

            let transform: sharp.Sharp = sharp()
            transform.toFormat(newImageFormat)

            // Resize the image
            if (options && (options.width || options.height)) {
                let strechtMethod = options.imageStretchMethod 
                ? (options.imageStretchMethod == ImageStretchMethod.fill ? sharp.fit.fill : sharp.fit.cover)
                : sharp.fit.fill
                      
                let fitMethod = options.preserveAspectRatio ? sharp.fit.inside : strechtMethod

                transform.resize(options.width, options.height, {
                    fit: fitMethod,
                    withoutEnlargement: options.withoutEnlargement ? true : false
                })
            }

            let chunks = []
            fs.createReadStream(tmpDir + tmpName)
                .pipe(transform)
                .on('data', chunk => { chunks.push(chunk) })
                .on('end', () => { resolve({ base64Data: Buffer.concat(chunks).toString('base64') }) })
        })
    }
}
