import { Request, Response, Express, NextFunction } from 'express'
import { FileRepository } from '../Repositories';

module.exports = function (app: Express) {
	// Get File
	app.get('/files/:fileId', function (req: Request, res: Response, next: NextFunction) {
		let fileId: string = req.params.fileId
		console.log("Get File: " + fileId)
		if (fileId) {
			FileRepository.loadFile(fileId).then((fileData) => {
				res.setHeader('Content-Type', fileData.format)
				res.send(fileData.data)
				res.end()
			}).catch(e => res.end())
		}
	})
}