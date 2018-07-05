import { Request, Response, Express, NextFunction } from 'express'

module.exports = function (app: Express) {

	app.post('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {

	})

	app.post('/api/users/query', function (req: Request, res: Response, next: NextFunction) {

	})

	app.get('/api/users', function (req: Request, res: Response, next: NextFunction) {

	})

	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {

	})

	app.delete('/api/users', function (req: Request, res: Response, next: NextFunction) {

	})

}