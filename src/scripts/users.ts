import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository } from '../Repositories'
import { UserFunctions, Protocol, IUserModel, IPublicUser } from '../models';

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
				Protocol.error(res, "USER_AUTH_FAIL")
			}
		}).catch(error => Protocol.error(res, "USER_QUERY_FAIL"))
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
		Protocol.error(res, "NOT_IMPLEMENTED")
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
		}).catch(error => Protocol.error(res, "USER_QUERY_FAIL"))
	})

	// Create user
	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.query.user_name
		let userPassword = req.query.user_password

		if (!Protocol.validateParams([userName, userPassword])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let user = <IUserModel>{}
		if (!UserFunctions.setName(user, userName)) {
			return Protocol.error(res, 'USER_NAME_INVALID')
		}

		if (!UserFunctions.setPassword(user, userPassword)) {
			return Protocol.error(res, 'USER_PASSWORD_INVALID')
		}

		userRepo.createNewUser(user.username, user.password).then((newUser) => {
			let publicUser = UserFunctions.toPublicUser(newUser)
			Protocol.success(res, publicUser)
		}).catch(error => Protocol.error(res, "USER_CREATE_FAIL"))
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
		}).catch(error => Protocol.error(res, "USER_DELETE_FAIL"))
	})

	// Update User
	app.put('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let newUser: any = {}

		try {
			newUser = JSON.parse(req.body)
		} catch (error) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let userId = newUser['id']
		userRepo.findById(userId).then((user: IUserModel) => {
			let success: boolean = true

			if (newUser['username'] && !UserFunctions.setName(user, newUser['username'])) {
				return Protocol.error(res, "USER_UPDATE_USERNAME_FAIL")
			}

			if (newUser['password'] && UserFunctions.setPassword(user, newUser['password'])) {
				return Protocol.error(res, "USER_UPDATE_PASSWORD_FAIL")
			}

			userRepo.update(userId, user).then(() => {
				Protocol.createUserSession(req, user).then(() => {
					Protocol.success(res, UserFunctions.toPublicUser(user))
				}).catch(e => Protocol.error(res, "SESSION_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "USER_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "USER_QUERY_FAIL"))
	})
}