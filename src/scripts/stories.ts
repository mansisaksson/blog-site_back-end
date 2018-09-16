import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, ChapterContentRepository } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel, IStoryChapterModel, IPublicStoryChapter } from '../models'

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let chapterContentRepo = new ChapterContentRepository()

	// Create Story
	app.post('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.body['title'] ? req.body['title'] : "Default Title"
		let chapter1Title = req.body['chapter1Title'] ? req.body['chapter1Title'] : "Default Chapter Title"

		if (!Protocol.validateParams([userId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, userId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		chapterContentRepo.createNewChapterContent("").then(chapterContent => {
			storyRepo.createNewStory(title, userId, chapter1Title, chapterContent.id).then((story: IStoryModel) => {
				let publicStory = StoryFunctions.toPublicStory(story)
				Protocol.success(res, publicStory)
			}).catch(e => Protocol.error(res, "STORY_CREATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL"))
	})

	// Update Story
	app.put('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let newStoryProperties: any = req.body

		if (!Protocol.validateParams([storyId, newStoryProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then((story: IStoryModel) => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}

			let updateStory = function () {
				storyRepo.update(storyId, story).then(() => {
					Protocol.success(res, StoryFunctions.toPublicStory(story))
				}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
			}

			if (newStoryProperties['title']) {
				if (!StoryFunctions.setStoryTitle(story, newStoryProperties.title)) {
					return Protocol.error(res, "INVALID_STORY_TITLE")
				}
			}

			if (newStoryProperties['accessibility']) {
				if (!StoryFunctions.setStoryAccesibility(story, newStoryProperties.accessibility)) {
					return Protocol.error(res, "INVALID_STORY_ACCESSIBILITY")
				}
			}

			if (newStoryProperties['thumbnail']) {
				StoryFunctions.setStoryThumbnail(story, newStoryProperties.thumbnail).then(() => {
					updateStory()
				}).catch(e => {
					console.log(e)
					Protocol.error(res, "INVALID_STORY_THUMBNAIL")
				})
			} else {
				updateStory()
			}
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Delete Story
	app.delete('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let URIs = []
			story.chapters.forEach(chapter => URIs.push(chapter.URI))
			chapterContentRepo.deleteAll(URIs).then(() => {
				storyRepo.delete(story.id).then(() => {
					Protocol.success(res)
				}).catch(e => Protocol.error(res, "STORY_DELETE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Stories
	app.get('/api/stories/query', function (req: Request, res: Response, next: NextFunction) {
		let authorId = req.query.userId
		let searchQuery = req.query.searchQuery

		let idQuery = authorId
		if (!Protocol.validateParams([authorId])) {
			idQuery = ""
		}
		let query = searchQuery
		if (!Protocol.validateParams([searchQuery])) {
			query = ""
		}

		let userSession = Protocol.getUserSession(req)
		let userSessionId = ''
		if (userSession) {
			userSessionId = userSession._id
		}

		idQuery = ".*" + idQuery + ".*"
		query = ".*" + query + ".*"

		let mgdbQuery = {
			title: { $regex: query },
			$and: [{
				$or: [
					{ accessibility: 'public' },
					{ authorId: userSessionId }
				]
			}, { authorId: { $regex: idQuery } }
			]
		}
		storyRepo.find(mgdbQuery, 100).then((stories: IStoryModel[]) => {
			let result = stories.map(s => StoryFunctions.toPublicStory(s))
			Protocol.success(res, result)
		}).catch(e => {
			console.log(e)
			Protocol.error(res, "STORY_QUERY_FAIL")
		})
	})

	// Get Story
	app.get('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let userSession = Protocol.getUserSession(req)
		let userSessionId = ''
		if (userSession) {
			userSessionId = userSession._id
		}

		// TODO: Don't return if private
		storyRepo.findById(storyId).then((story: IStoryModel) => {
			Protocol.success(res, StoryFunctions.toPublicStory(story))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Create Chapter
	app.post('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let chapterTitle = req.body['title'] ? req.body['title'] : 'Default Title'

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			chapterContentRepo.createNewChapterContent("").then(chapterContent => {
				storyRepo.createNewChapter(storyId, chapterTitle, chapterContent.id).then(chapter => {
					let publicChapter = StoryFunctions.toPublicChapter(story.id, chapter)
					Protocol.success(res, publicChapter)
				}).catch(e => Protocol.error(res, "STORY_CHAPTER_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Update Chapter
	app.put('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let newChapterProperties = req.body

		if (!Protocol.validateParams([chapterId, newChapterProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findByChapterId(chapterId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let chapterIndex = story.chapters.findIndex(chapter => { return chapter.id == chapterId })
			let properties = ['title']
			Object.keys(newChapterProperties).forEach(key => {
				if (properties.find(p => { return p === key })) {
					story.chapters[chapterIndex][key] = newChapterProperties[key]
				}
			})
			storyRepo.update(story.id, story).then(e => {
				Protocol.success(res, StoryFunctions.toPublicChapter(story._id, story.chapters[chapterIndex]))
			}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_QUERY_FAIL"))
	})

	// Delete Chapter
	app.delete('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

		if (!Protocol.validateParams([chapterId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findByChapterId(chapterId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let chapter = story.chapters.find(chapter => { return chapter.id == chapterId })
			chapterContentRepo.delete(chapter.URI).then(() => {
				story.chapters = story.chapters.filter(chapter => { return chapter.id != chapterId })
				storyRepo.update(story.id, story).then(() => {
					Protocol.success(res)
				}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyIds: string[] = JSON.parse(req.query.chapterIds)

		if (!Protocol.validateParams([storyIds])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// TODO: Don't return if private

		storyRepo.findChapters(storyIds).then((chapters: IStoryChapterModel[]) => {
			let result: IPublicStoryChapter[] = []
			chapters.forEach(c => {
				storyRepo.findByChapterId(c._id).then((story) => {
					result.push(StoryFunctions.toPublicChapter(story._id, c))
				}).catch(e => { /*TODO: Error*/ })
			})
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Update Chapter Content
	app.put('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let content = req.body['content'] ? req.body['content'] : ""

		if (!Protocol.validateParams([chapterId, content])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findByChapterId(chapterId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let chapter = story.chapters.find(chapter => { return chapter.id == chapterId })
			chapterContentRepo.updateContent(chapter.URI, content).then(() => {
				Protocol.success(res, { URI: chapter.URI })
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Chapter Content
	app.get('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let contentURIs = req.query.contentURIs

		if (!Protocol.validateParams([contentURIs])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// TODO: Do not allow access if private
		let contentURIArray = JSON.parse(contentURIs)
		chapterContentRepo.findByIds(contentURIArray).then(contents => {
			let result = contents.map(c => StoryFunctions.toPublicContent(c))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_QUERY_FAIL"))
	})

}