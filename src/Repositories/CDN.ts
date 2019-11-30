import * as fs from 'fs'
import * as glob from 'glob'

export interface FileData {
	data: Buffer,
	format: string
}

export namespace CDN {
	let filesDir = '/data/uploads/'

	// Fallback if we're not running in the server environment
	if (!fs.existsSync(filesDir)) {
		filesDir = "uploads/"
	}

	export function saveFile(fileId: string, base64Data: string, options?: { compressed: true }): Promise<FileData> {
		return new Promise<any>(async function (resolve, reject) {
			try { await deleteFile(fileId) } catch (e) {}

			try {
				if (!fs.existsSync(filesDir)) {
					fs.mkdirSync(filesDir)
				}

				fs.writeFileSync(filesDir + fileId, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })
				resolve(fileId)
			} catch (error) {
				reject(error)
			}
		})
	}

	export function loadFile(fileId: string, options?: { compressed: true }): Promise<FileData> {
		return new Promise<FileData>((resolve, reject) => {
			try {
				let filePath = filesDir + fileId
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