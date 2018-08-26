import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository } from '../Repositories'
import { UserFunctions, Protocol, IUserModel } from '../models';

module.exports = function (app: Express) {
	let userRepo = new UserRepository()

	// Authenticate User
	app.get('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.query.user_name
		let userPassword = req.query.user_password

		if (!Protocol.validateParams([userName, userPassword])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		userRepo.findUser(userName).then((user) => {
			if (UserFunctions.validatePassword(user, userPassword)) {
				Protocol.createUserSession(req, user).then(() => {
					let publicUser = UserFunctions.toPublicUser(user)
					Protocol.success(res, publicUser)
				}).catch(error => Protocol.error(res, "SESSION_CREATE_FAIL"))
			} else {
				Protocol.error(res, "USER_AUTH_FAIL", "Invalid Password")
			}
		}).catch(error => Protocol.error(res, "USER_QUERY_FAIL", "Could Not Find User"))
	})

	// Unauthenticate User
	app.post('/api/session/invalidate', function (req: Request, res: Response, next: NextFunction) {
		let user: IUserModel = Protocol.getUserSession(req);
		if (user) {
			Protocol.destroyUserSession(req).then(() => {
				Protocol.success(res, true)
			}).catch(error => Protocol.error(res, "SESSION_INVALIDATE_FAIL"))
		}
		else {
			Protocol.error(res, "SESSION_INVALID")
		}
	})

	// Authenticate User
	app.get('/api/session', function (req: Request, res: Response, next: NextFunction) {
		let user: IUserModel = Protocol.getUserSession(req);
		if (user) {
			let publicUser = UserFunctions.toPublicUser(user)
			Protocol.success(res, publicUser)
		}
		else {
			Protocol.success(res, undefined)
		}
	})

	// Find User
	app.get('/api/users/query', function (req: Request, res: Response, next: NextFunction) {
		Protocol.error(res, "NOT_IMPLEMENTED", "Not yet implemented")
	})

	// Get User
	app.get('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let id = req.query.user_id

		if (!Protocol.validateParams([id])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		userRepo.findById(id).then((user) => {
			let publicUser = UserFunctions.toPublicUser(user)
			Protocol.success(res, publicUser)
		}).catch(error => Protocol.error(res, "USER_QUERY_FAIL", "Could Not Find User"))
	})

	// Create user
	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.query.user_name
		let userPassword = req.query.user_password

		if (!Protocol.validateParams([userName, userPassword])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		userRepo.createNewUser(userName, userPassword).then((newUser) => {
			let publicUser = UserFunctions.toPublicUser(newUser)
			Protocol.success(res, publicUser)
		}).catch(error => Protocol.error(res, "USER_CREATE_FAIL", "Failed to create user"))
	})

	// Delete User
	app.delete('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let user_id = req.query.user_id

		if (!Protocol.validateParams([user_id])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, user_id)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		userRepo.delete(user_id).then((result) => {
			Protocol.success(res, result)
		}).catch(error => Protocol.error(res, "USER_DELETE_FAIL", "Failed to delete user"))
	})

}