import * as fs from 'fs'
import * as sharp from 'sharp'

export namespace FileRepository {
	export function saveImage_Base64(base64Data: string, format: string, resizeOptions?: { width: number, height: number }): Promise<any> {
		return FileRepository.saveImage(Buffer.from(base64Data).toString('base64'), format, resizeOptions)
	}

	export function saveImage(data: string, format: string, resizeOptions?: { width: number, height: number }): Promise<any> {
		return new Promise<any>(function (resolve, reject) {
			let transform: sharp.SharpInstance = sharp()
			if (resizeOptions) {
				transform.toFormat(format)
				transform.resize(resizeOptions.width, resizeOptions.height)
			}

			try {
				fs.writeFile('tmp/resize_tmp.png', new Buffer(data), (err) => {
					if (err) {
						return reject(err)
					}
					console.log("The file was succesfully saved!");
					resolve()
				})
				// TODO: https://malcoded.com/posts/nodejs-image-resize-express-sharp
				// const readStream = fs.createReadStream('tmp/resize_tmp')
				// readStream.pipe(transform)
			} catch (error) {
				reject(error)
			}
		})
	}

	export function loadFile(fileId: string): string {
		return ""
	}

	export function loadFileAsBase64(fileId: string): string {
		return ""
	}
}