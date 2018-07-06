import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository } from './../Repositories'
import { UserFunctions } from '../models';

module.exports = function (app: Express) {
	let userRepo = new UserRepository()

	app.post('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {

	})

	app.post('/api/users/query', function (req: Request, res: Response, next: NextFunction) {

	})

	app.get('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let id = req.params['user_id']

		userRepo.findById(id).then((newUser) => {
			let publicUser = UserFunctions.toPublicUser(newUser)
			res.end(publicUser)
		}).catch(error => res.end(error))
	})

	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {
			let userName = req.params['user_name']
			let password = req.params['user_password']
			
			userRepo.createNewUser(userName, password).then((newUser) => {
				let publicUser = UserFunctions.toPublicUser(newUser)
				res.end(publicUser)
			}).catch(error => res.end(error))
	})

	app.delete('/api/users', function (req: Request, res: Response, next: NextFunction) {

	})

}