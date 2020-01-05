import { Request, Response, Express, NextFunction } from 'express'
import { FileRepository, CDN } from '../Repositories'
import { IFileModel, Protocol, FileFunctions } from '../models'

module.exports = function (app: Express) {
	let fileRepo = new FileRepository()

	// Get File
	app.get('/api/file', async function (req: Request, res: Response, next: NextFunction) {
		let fileId: string = req.params.fileId
		if (!fileId) {
			return Protocol.error(res, "INVALID_FILE_ID")
		}

		let file = await fileRepo.findById(fileId)
		if (!file) {
			return Protocol.error(res, "FILE_QUERY_FAIL")
		}

		Protocol.success(res, FileFunctions.toPublicFile(file))
	})

	// Create File
	app.post('/api/file', async function (req: Request, res: Response, next: NextFunction) {
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

		let file = await fileRepo.createNewFile(fileName, fileType, userId, fileMetaData)
		if (!file) {
			return Protocol.error(res, "FILE_CREATE_FAIL")
		}

		Protocol.success(res, FileFunctions.toPublicFile(file))
	})

	// Update File
	app.put('/api/file', async function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId
		let newFileProperties: any = req.body

		if (!Protocol.validateParams([fileId, newFileProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let file: IFileModel = await fileRepo.findById(fileId);
		if (!file) {
			return Protocol.error(res, "FILE_QUERY_FAIL")
		}

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

		if (!await fileRepo.update(fileId, file)) {
			Protocol.error(res, "FILE_UPDATE_FAIL")
		}

		Protocol.success(res, FileFunctions.toPublicFile(file))
	})

	// Delete File
	app.delete('api/file', async function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId

		if (!Protocol.validateParams([fileId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let file = await fileRepo.findById(fileId)
		if (!file) {
			return Protocol.error(res, "FILE_QUERY_FAIL")
		}
		if (!Protocol.validateUserSession(req, file.ownerId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		if (!await fileRepo.delete(fileId)) {
			return Protocol.error(res, "FILE_DELETE_FAIL")
		}

		await CDN.deleteFile(fileId) // Not checking for success, a file can exist without content

		Protocol.success(res)
	})

	// Get File Content
	app.get('/api/file/content/:fileId', async function (req: Request, res: Response, next: NextFunction) {
		let fileId: string = req.params.fileId
		if (!fileId) {
			return Protocol.error(res, "INVALID_FILE_ID")
		}

		let fileData = await CDN.loadFile(fileId)
		if (!fileData) {
			return Protocol.error(res, "FILE_DATA_QUERY_FAIL")
		}

		res.setHeader('Content-Type', fileData.format)
		res.send(fileData.data)
		res.end()
	})

	// Update File Content
	app.put('/api/file/content', async function (req: Request, res: Response, next: NextFunction) {
		let fileId = req.query.fileId
		let newFileContent: any = req.body

		if (!Protocol.validateParams([fileId, newFileContent])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let file = await fileRepo.findById(fileId)
		if (!file) {
			return Protocol.error(res, "FILE_QUERY_FAIL")
		}

		if (!Protocol.validateUserSession(req, file.ownerId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		if (!await CDN.saveFile(fileId, newFileContent)) {
			return Protocol.error(res, "FILE_DATA_UPDATE_FAIL")
		}

		Protocol.success(res)
	})
}