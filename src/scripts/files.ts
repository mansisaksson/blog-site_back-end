import { Request, Response, Express, NextFunction } from 'express'
import { FileRepository, CDN } from '../Repositories'
import { IFileModel, Protocol, FileFunctions } from '../models'

module.exports = function (app: Express) {
	let fileRepo = new FileRepository()

	// Get File
	app.get('/api/file', function (req: Request, res: Response, next: NextFunction) {
		let fileId: string = req.params.fileId
		if (fileId) {
			fileRepo.findById(fileId).then((file: IFileModel) => {
				let publicFile = FileFunctions.toPublicFile(file)
				Protocol.success(res, publicFile)
			}).catch(e => Protocol.error(res, "FILE_QUERY_FAIL"))
		}
	})

	// Create File
	app.post('/api/file', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let fileName = req.body['fileName'] ? req.body['fileName'] : "default_file_name"
		let fileType = req.body['fileType']
		let fileMetaData = req.body['metaData']

		if (!Protocol.validateParams([userId, fileType])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, userId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		fileRepo.createNewFile(fileName, fileType, userId, fileMetaData).then(file => {
			let publicFile = FileFunctions.toPublicFile(file)
			Protocol.success(res, publicFile)
		}).catch(e => Protocol.error(res, "FILE_CREATE_FAIL"))
	})

	// Update File
	app.put('/api/file', function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId
		let newFileProperties: any = req.body

		if (!Protocol.validateParams([fileId, newFileProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		fileRepo.findById(fileId).then(file => {
			if (!Protocol.validateUserSession(req, file.ownerId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}

			if (newFileProperties['fileName']) {
				if (!FileFunctions.setFileName(file, newFileProperties.fileName)) {
					return Protocol.error(res, "INVALID_FILE_NAME")
				}
			}

			if (newFileProperties['fileType']) {
				if (!FileFunctions.setFileType(file, newFileProperties.fileType)) {
					return Protocol.error(res, "INVALID_FILE_TYPE")
				}
			}

			if (newFileProperties['metaData']) {
				if (!FileFunctions.setFileMetaData(file, newFileProperties.metaData)) {
					return Protocol.error(res, "INVALID_FILE_META_DATA")
				}
			}

			fileRepo.update(fileId, file).then(() => {
				Protocol.success(res, FileFunctions.toPublicFile(file))
			}).catch(e => Protocol.error(res, "FILE_UPDATE_FAIL"))

		}).catch(e => Protocol.error(res, "FILE_QUERY_FAIL"))
	})

	// Delete File
	app.delete('api/file', function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId

		if (!Protocol.validateParams([fileId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		fileRepo.findById(fileId).then(file => {
			if (!Protocol.validateUserSession(req, file.ownerId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}

			fileRepo.delete(fileId).then(() => {
				CDN.deleteFile(fileId).then(() => {
					Protocol.success(res)
				}).catch(e => Protocol.success(res)) // A file can exist without content
			}).catch(e => Protocol.error(res, "FILE_DELETE_FAIL"))
		}).catch(e => Protocol.error(res, "FILE_QUERY_FAIL"))
	})

	// Get File Content
	app.get('/api/file/content/:fileId', function (req: Request, res: Response, next: NextFunction) {
		let fileId: string = req.params.fileId
		if (fileId) {
			CDN.loadFile(fileId).then((fileData) => {
				res.setHeader('Content-Type', fileData.format)
				res.send(fileData.data)
				res.end()
			}).catch(e => Protocol.error(res, "FILE_DATA_QUERY_FAIL"))
		}
	})

	// Update File Content
	app.put('/api/file/content', function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId
		let newFileContent: any = req.body

		if (!Protocol.validateParams([fileId, newFileContent])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		fileRepo.findById(fileId).then(file => {
			if (!Protocol.validateUserSession(req, file.ownerId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}

			CDN.saveFile(fileId, newFileContent).then(() => {
				Protocol.success(res)
			}).catch(e => Protocol.error(res, "FILE_DATA_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "FILE_QUERY_FAIL"))
	})
}