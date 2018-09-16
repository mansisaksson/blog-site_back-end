import { Request, Response, Express, NextFunction } from 'express'

module.exports = function (app: Express) {
	// Get File
	app.get('/api/files/*', function (req: Request, res: Response, next: NextFunction) {
		console.log(req.path)
	})
}