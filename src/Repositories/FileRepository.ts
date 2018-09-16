import * as fs from 'fs'
import * as sharp from 'sharp'
import * as uuidv1 from 'uuid/v1'
import * as glob from 'glob'

export namespace FileRepository {
	export function saveImage_Base64(base64Data: string, format: string, resizeOptions?: { width: number, height: number }): Promise<string> {
		return new Promise<any>(function (resolve, reject) {
			try {
				if (!fs.existsSync('tmp')) {
					fs.mkdirSync('tmp')
				}

				if (!fs.existsSync('uploads')) {
					fs.mkdirSync('uploads')
				}

				let tmpName = 'resize_tmp.' + format
				fs.writeFileSync('tmp/' + tmpName, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })

				let transform: sharp.SharpInstance = sharp()
				if (resizeOptions) {
					transform.toFormat(format)
					transform.resize(resizeOptions.width, resizeOptions.height)
				}

				let fileId = uuidv1()
				let filePath = 'uploads/' + fileId + '.' + format
				fs.createReadStream('tmp/' + tmpName)
					.pipe(transform)
					.pipe(fs.createWriteStream(filePath))
				resolve(fileId)
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

	export function deleteFile(fileId: string, options?: { ignoreError: boolean }): Promise<any> {
		return new Promise<any>(function (resolve, reject) {
			try {
				let filePath = 'uploads/' + fileId + '*'
				glob(filePath, {}, function (er, files) {
					for (const file of files) {
						fs.unlinkSync(file)
						console.log("Remove: ")
						console.log(file)
					}
					resolve()
				})
			} catch (error) {
				reject(error)
			}
		})
	}
}