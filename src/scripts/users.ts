import { Request, Response, Express, NextFunction } from 'express'
import { UserRepository, StoryRepository, ChapterContentRepository } from '../Repositories'
import { UserFunctions, Protocol, IUserModel, IPublicUser } from '../models';
import { isArray } from 'util';
import e = require('express');

module.exports = function (app: Express) {
	let userRepo = new UserRepository()
	let storyRepo = new StoryRepository()
	let chapterContentRepo = new ChapterContentRepository()

	// Authenticate User
	app.post('/api/authenticate', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.body['user_name']
		let userPassword = req.body['user_password']

		if (!Protocol.validateParams([userName, userPassword])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		userRepo.findUser(userName).then((user) => {
			UserFunctions.validatePassword(user, userPassword).then(() => {
				Protocol.createUserSession(req, user).then(() => {
					let publicUser = UserFunctions.toPublicUser(user)
					Protocol.success(res, publicUser)
				}).catch(e => Protocol.error(res, "SESSION_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "USER_AUTH_FAIL"))
		}).catch(e => Protocol.error(res, "USER_QUERY_FAIL"))
	})

	// Unauthenticate User
	app.post('/api/session/invalidate', function (req: Request, res: Response, next: NextFunction) {
		let user: IUserModel = Protocol.getUserSession(req);
		if (user) {
			Protocol.destroyUserSession(req).then(() => {
				Protocol.success(res, true)
			}).catch(e => Protocol.error(res, "SESSION_INVALIDATE_FAIL"))
		}
		else {
			Protocol.error(res, "SESSION_INVALID")
		}
	})

	// Get Session
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
		let ids = req.query.user_ids
		if (!Protocol.validateParams([ids])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// Only one id, so not passed as an array
		if (!isArray(ids)) {
			ids = [ids]
		}

		userRepo.findByIds(ids).then((users) => {
			let publicUsers = []
			users.forEach(user => publicUsers.push(UserFunctions.toPublicUser(user)))
			Protocol.success(res, publicUsers)
		}).catch(error => Protocol.error(res, "USER_QUERY_FAIL"))
	})

	// Create user
	app.post('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let userName = req.body['userName']
		let userPassword = req.body['userPassword']
		let registrationKey = req.body['registrationKey']

		if (!Protocol.validateParams([userName, userPassword, registrationKey])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (registrationKey != "FJx38J%snpEUg!US**zY") {
			return Protocol.error(res, 'REGISTRATION_KEY_INVALID')
		}

		let user = <IUserModel>{
			username: '',
			password: ''
		}

		UserFunctions.setUserName(user, userName).then(() => {
			UserFunctions.setPassword(user, userPassword).then((hashedPw) => {
				userRepo.createNewUser(user.username, user.password).then((newUser) => {
					let publicUser = UserFunctions.toPublicUser(newUser)
					Protocol.success(res, publicUser)
				}).catch(e => Protocol.error(res, "USER_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, 'USER_PASSWORD_INVALID'))
		}).catch(e => Protocol.error(res, e))
	})

	// Update User
	app.put('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let newUser: any = req.body

		if (!Protocol.validateParams([userId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, userId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}
		
		userRepo.findById(userId).then(async (user: IUserModel) => {
			if (newUser['username']) {
				try {
					await UserFunctions.setUserName(user, newUser['username'])
				} catch (error) {
					return Protocol.error(res, "USER_UPDATE_NAME_FAIL")
				}
			}

			if (newUser['displayName']) {
				if (!UserFunctions.setDisplayName(user, newUser['displayName'])) {
					return Protocol.error(res, "USER_UPDATE_DISPLAY_NAME_FAIL")
				}
			}

			if (newUser['profilePicture']) {
				try {
					await UserFunctions.setProfilePictureContent(user, newUser['profilePicture'])
				} catch (e) {
					return Protocol.error(res, "USER_UPDATE_PROFILE_PICTURE_FAIL")
				}
			}

			if (newUser['banner']) {
				try {
					await UserFunctions.setBannerContent(user, newUser['banner'])
				} catch (e) {
					return Protocol.error(res, "USER_UPDATE_BANNER_FAIL")
				}
			}
			
			if (newUser['description']) {
				if (!UserFunctions.setDescription(user, newUser['description'])) {
					return Protocol.error(res, "USER_UPDATE_DESCRIPTION_FAIL")
				}
			}

			if (newUser['password']) {
				try {
					await UserFunctions.setPassword(user, newUser['password'])
				} catch (e) {
					return Protocol.error(res, "USER_UPDATE_PASSWORD_FAIL")
				}
			}

			userRepo.update(userId, user).then(() => {
				Protocol.createUserSession(req, user).then(() => {
					Protocol.success(res, UserFunctions.toPublicUser(user))
				}).catch(e => Protocol.error(res, "SESSION_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "USER_UPDATE_FAIL"))

		}).catch(e => Protocol.error(res, "USER_QUERY_FAIL"))
	})

	// Delete User
	app.delete('/api/users', function (req: Request, res: Response, next: NextFunction) {
		let user_id = req.query.userId
		let user_password = req.query.userPassword

		if (!Protocol.validateParams([user_id, user_password])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, user_id)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		userRepo.findById(user_id).then((user) => {
			UserFunctions.validatePassword(user, user_password).then(() => {
				userRepo.delete(user_id).then(() => {
					storyRepo.findByAuthorId(user_id).then(stories => {
						let storyIds: string[] = stories.map(s => s._id.toHexString())
						let URIs: string[] = []
						stories.forEach(s => s.chapters.forEach(c => URIs.push(c.URI)))
						chapterContentRepo.deleteAll(URIs).then(() => {
							storyRepo.deleteAll(storyIds).then(() => {
								Protocol.success(res)
							}).catch(e => Protocol.error(res, "STORY_DELETE_FAIL"))
						}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL"))
					}).catch(e => Protocol.success(res)) // We assume that the user has no stories
				}).catch(e => Protocol.error(res, "USER_DELETE_FAIL"))
			}).catch(e => Protocol.error(res, "USER_PASSWORD_INVALID"))
		}).catch(e => Protocol.error(res, "USER_QUERY_FAIL"))
	})

}