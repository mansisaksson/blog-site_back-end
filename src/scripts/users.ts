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
	app.post('/api/authenticate', async function (req: Request, res: Response, next: NextFunction) {
		let userName = req.body['user_name']
		let userPassword = req.body['user_password']

		if (!Protocol.validateParams([userName, userPassword])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let user = await userRepo.findUser(userName)
		if (!user) {
			return Protocol.error(res, "USER_QUERY_FAIL")
		}

		if (!await UserFunctions.validatePassword(user, userPassword)) {
			return Protocol.error(res, "USER_AUTH_FAIL")
		}

		if (!await Protocol.createUserSession(req, user)) {
			return Protocol.error(res, "SESSION_CREATE_FAIL")
		}

		Protocol.success(res, UserFunctions.toPublicUser(user))
	})

	// Unauthenticate User
	app.post('/api/session/invalidate', async function (req: Request, res: Response, next: NextFunction) {
		let user: IUserModel = Protocol.getUserSession(req);
		if (!user) {
			return Protocol.error(res, "SESSION_INVALID")
		}

		if (!await Protocol.destroyUserSession(req)) {
			return Protocol.error(res, "SESSION_INVALIDATE_FAIL")
		}

		Protocol.success(res, true)
	})

	// Get Session
	app.get('/api/session', function (req: Request, res: Response, next: NextFunction) {
		let user: IUserModel = Protocol.getUserSession(req);
		if (!user) {
			return Protocol.success(res, undefined)
		}

		Protocol.success(res, UserFunctions.toPublicUser(user))
	})

	// Find User
	app.get('/api/users/query', function (req: Request, res: Response, next: NextFunction) {
		Protocol.error(res, "NOT_IMPLEMENTED")
	})

	// Get User
	app.get('/api/users', async function (req: Request, res: Response, next: NextFunction) {
		let ids = req.query.user_ids
		if (!Protocol.validateParams([ids])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// Only one id, so not passed as an array
		if (!isArray(ids)) {
			ids = [ids]
		}

		let users = await userRepo.findByIds(ids)
		if (!users) {
			return Protocol.error(res, "USER_QUERY_FAIL")
		}

		let publicUsers = []
		users.forEach(user => publicUsers.push(UserFunctions.toPublicUser(user)))
		Protocol.success(res, publicUsers)
	})

	// Create user
	app.post('/api/users', async function (req: Request, res: Response, next: NextFunction) {
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

		let setNameResult = await UserFunctions.setUserName(user, userName)
		if (setNameResult.err) {
			return Protocol.error(res, setNameResult.err)
		}

		let { hashedPassword, err } = await UserFunctions.setPassword(user, userPassword)
		if (err) {
			return Protocol.error(res, err)
		}

		let newUser = await userRepo.createNewUser(user.username, user.password)
		if (!newUser) {
			return Protocol.error(res, "USER_CREATE_FAIL")
		}

		Protocol.success(res, UserFunctions.toPublicUser(newUser))
	})

	// Update User
	app.put('/api/users', async function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let newUser: any = req.body

		if (!Protocol.validateParams([userId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, userId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		let user = await userRepo.findById(userId)
		if (!user) {
			return Protocol.error(res, "USER_QUERY_FAIL")
		}

		if (newUser['username']) {
			let setNameResult = await UserFunctions.setUserName(user, newUser['username'])
			if (setNameResult.err) {
				return Protocol.error(res, setNameResult.err)
			}
		}

		if (newUser['displayName']) {
			if (!UserFunctions.setDisplayName(user, newUser['displayName'])) {
				return Protocol.error(res, "USER_UPDATE_DISPLAY_NAME_FAIL")
			}
		}

		if (newUser['profilePicture']) {
			if (!await UserFunctions.setProfilePictureContent(user, newUser['profilePicture'])) {
				return Protocol.error(res, "USER_UPDATE_PROFILE_PICTURE_FAIL")
			}
		}

		if (newUser['banner']) {
			if (!await UserFunctions.setBannerContent(user, newUser['banner'])) {
				return Protocol.error(res, "USER_UPDATE_BANNER_FAIL")
			}
		}

		if (newUser['description']) {
			if (!UserFunctions.setDescription(user, newUser['description'])) {
				return Protocol.error(res, "USER_UPDATE_DESCRIPTION_FAIL")
			}
		}

		if (newUser['password']) {
			let setPWResult = await UserFunctions.setPassword(user, newUser['password'])
			if (setPWResult.err) {
				return Protocol.error(res, setPWResult.err)
			}
		}

		if (!await userRepo.update(userId, user)) {
			Protocol.error(res, "USER_UPDATE_FAIL")
		}

		if (!await Protocol.createUserSession(req, user)) {
			return Protocol.error(res, "SESSION_CREATE_FAIL")
		}

		Protocol.success(res, UserFunctions.toPublicUser(user))
	})

	// Delete User
	app.delete('/api/users', async function (req: Request, res: Response, next: NextFunction) {
		let user_id = req.query.userId
		let user_password = req.query.userPassword

		if (!Protocol.validateParams([user_id, user_password])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, user_id)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		let user = await userRepo.findById(user_id)
		if (!user) {
			return Protocol.error(res, "USER_QUERY_FAIL")
		}

		if (!UserFunctions.validatePassword(user, user_password)) {
			return Protocol.error(res, "USER_PASSWORD_INVALID")
		}

		if (!await userRepo.delete(user_id)) {
			return Protocol.error(res, "USER_DELETE_FAIL")
		}

		// Delete user stories
		{
			let stories = await storyRepo.findByAuthorId(user_id)
			if (!stories) {
				return Protocol.success(res) // We assume that the user has no stories
			}

			let storyIds: string[] = stories.map(s => s._id.toHexString())
			let URIs: string[] = []
			stories.forEach(s => s.chapters.forEach(c => URIs.push(c.URI)))
			if (!await chapterContentRepo.deleteAll(URIs)) {
				return Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL")
			}

			if (!await storyRepo.deleteAll(storyIds)) {
				return Protocol.error(res, "STORY_DELETE_FAIL")
			}
		}
		
		Protocol.success(res)
	})

}