import * as fs from 'fs'
import * as sharp from 'sharp'
import * as uuidv1 from 'uuid/v1'
import * as glob from 'glob'

export interface FileData {
	data: Buffer,
	format: string
}

export namespace FileRepository {
	let tmpDir = 'tmp/'
	let filesDir = '/home/mans/Documents/Web Server/ss_uploads/'

	// Fallback if we're not running in the server environment
	if (!fs.existsSync(filesDir)) {
		filesDir = "uploads/"
	}

	export function saveImage_Base64(base64Data: string, format: string, resizeOptions?: { width: number, height: number }): Promise<string> {
		return new Promise<any>(function (resolve, reject) {
			try {
				if (!fs.existsSync(tmpDir)) {
					fs.mkdirSync(tmpDir)
				}

				if (!fs.existsSync(filesDir)) {
					fs.mkdirSync(filesDir)
				}

				let tmpName = 'resize_tmp.' + format
				fs.writeFileSync(tmpDir + tmpName, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })

				let transform: sharp.SharpInstance = sharp()
				if (resizeOptions) {
					transform.toFormat(format)
					transform.resize(resizeOptions.width, resizeOptions.height)
				}

				let fileId = uuidv1()
				let filePath = filesDir + fileId + '.' + format
				fs.createReadStream(tmpDir + tmpName)
					.pipe(transform)
					.pipe(fs.createWriteStream(filePath))
				resolve(fileId)
			} catch (error) {
				reject(error)
			}
		})
	}

	export function loadFile(fileId: string): Promise<FileData> {
		return new Promise<FileData>((resolve, reject) => {
			try {
				let filePath = filesDir + fileId + '.*'
				glob(filePath, {}, function (er, files: string[]) {
					if (files.length > 0) {
						let fileData = <FileData>{
							data: fs.readFileSync(files[0]),
							format: files[0].substr(files[0].lastIndexOf('.'))
						}
						resolve(fileData)
					} else {
						reject(er)
					}
				})
			} catch (error) {
				reject()
			}
		})
	}

	export function deleteFile(fileId: string, options?: { ignoreError: boolean }): Promise<any> {
		return new Promise<any>(function (resolve, reject) {
			try {
				let filePath = filesDir + fileId + '.*'
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