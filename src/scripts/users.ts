import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository } from '../Repositories'
import { UserFunctions, Protocol } from '../models';

module.exports = function (app: Express) {
	let userRepo = new UserRepository()

	app.get('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.query.user_name
		let userPassword = req.query.user_password
		userRepo.findUser(userName).then((user) => {
			if (UserFunctions.validatePassword(user, userPassword)) {
				let publicUser = UserFunctions.toPublicUser(user)
				Protocol.success(res, publicUser)
			} else {
				Protocol.error(res, "AUTH_FAIL", "Invalid Password")
			}

		}).catch(error => {
			console.error(error)
			Protocol.error(res, "QUERY_FAIL", "Could Not Find User")
		})
	})

	app.get('/api/users/query', function (req: Request, res: Response, next: NextFunction) {
		
	})

	app.get('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let id = req.query.user_id
		userRepo.findById(id).then((user) => {
			let publicUser = UserFunctions.toPublicUser(user)
			Protocol.success(res, publicUser)
		}).catch(error =>{
			console.log(error)
			Protocol.error(res, "QUERY_FAIL", "Could Not Find User")
		})
	})

	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.query.user_name
		let userPassword = req.query.user_password
		userRepo.createNewUser(userName, userPassword).then((newUser) => {
			let publicUser = UserFunctions.toPublicUser(newUser)
			Protocol.success(res, publicUser)
		}).catch(error => {
			console.error(error)
			Protocol.error(res, "USER_CREATE_FAIL", "Failed to create user")
		})
	})

	app.delete('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let user_id = req.query.user_id
		userRepo.delete(user_id).then((result) => {
			Protocol.success(res, result)
		}).catch(error => {
			console.log(error)
			Protocol.error(res, "USER_DELETE_FAIL", "Failed to delete user")
		})
	})

}