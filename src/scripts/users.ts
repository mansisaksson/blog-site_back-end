import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository } from './../Repositories'
import { UserFunctions } from '../models';

module.exports = function (app: Express) {
	let userRepo = new UserRepository()

	app.get('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.params['user_name']
		let userPassword = req.params['user_password']
		userRepo.findUser(userName).then((user) => {
			if (UserFunctions.validatePassword(user, userPassword)) {
				res.send(user)
				res.end()
			} else {
				res.statusCode = 400
				res.send("Invaid Password")
				res.end()
			}

		}).catch(error => {
			res.statusCode = 500
			res.end("Could not find user")
		})
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