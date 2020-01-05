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

	export async function saveFile(fileId: string, base64Data: string, options?: { compressed: true }): Promise<boolean> {
		await deleteFile(fileId)

		if (!fs.existsSync(filesDir)) {
			fs.mkdirSync(filesDir)
		}

		try {
			fs.writeFileSync(filesDir + fileId, Buffer.from(base64Data, 'base64'), { encoding: 'binary' })
		} catch (error) {
			console.log(error)
			return false			
		}

		return true
	}

	export async function loadFile(fileId: string, options?: { compressed: true }): Promise<FileData> {
		try {
			let filePath = filesDir + fileId
			glob(filePath, {}, function (er, files: string[]) {
				if (files.length > 0) {
					let fileData = <FileData>{
						data: fs.readFileSync(files[0]),
						format: files[0].substr(files[0].lastIndexOf('.'))
					}
					return fileData
				} else {
					return null
				}
			})
		} catch (error) {
			console.log(error)
			return null
		}
	}

	export async function deleteFile(fileId: string, options?: { ignoreError: boolean }): Promise<boolean> {
		try {
			let filePath = filesDir + fileId + '.*'
			glob(filePath, {}, function (er, files) {
				for (const file of files) {
					fs.unlinkSync(file)
					console.log("Remove: ")
					console.log(file)
				}
				return true
			})
		} catch (error) {
			console.log(error)
			return false
		}
	}
}