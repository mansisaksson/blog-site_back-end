import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, ChapterContentRepository } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel, IStoryChapterModel } from '../models'

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let chapterContentRepo = new ChapterContentRepository()

	// Create Story
	app.post('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.query.title
		let chapter1Title = req.query.chapter1Title

		if (!Protocol.validateParams([userId, title, chapter1Title])) {
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
		let userId = req.query.userId
		let searchQuery = req.query.searchQuery

		let idQuery = userId
		if (!Protocol.validateParams([userId])) {
			idQuery = ""
		}
		let query = searchQuery
		if (!Protocol.validateParams([searchQuery])) {
			query = ""
		}

		idQuery = ".*" + idQuery + ".*"
		query = ".*" + query + ".*"
		storyRepo.find({ authorId: { $regex: idQuery }, title: { $regex: query } }, 100).then((stories: IStoryModel[]) => {
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

		storyRepo.findById(storyId).then((story: IStoryModel) => {
			Protocol.success(res, StoryFunctions.toPublicStory(story))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Update Story Title
	app.put('/api/stories/title', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let newTitle = req.body

		if (!Protocol.validateParams([storyId, newTitle])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then((story: IStoryModel) => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			story.title = newTitle
			storyRepo.update(storyId, story).then(story => {
				Protocol.success(res)
			}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Create Chapter
	app.post('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let chapterTitle = req.query.chapterTitle

		if (!Protocol.validateParams([storyId, chapterTitle])) {
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

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.chapterIds

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then((story) => {
			let result = story.chapters.map(c => StoryFunctions.toPublicChapter(storyId, c))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Update Chapter
	app.put('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let newMetaData = {}
		
		try {
			newMetaData = JSON.parse(req.body)	
		} catch (error) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateParams([chapterId, newMetaData])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findByChapterId(chapterId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let chapterIndex = story.chapters.findIndex(chapter => { return chapter.id == chapterId })
			let properties = ['title']
			Object.keys(newMetaData).forEach(key => {
				if (properties.find(p => { return p === key })) {
					story.chapters[chapterIndex][key] = newMetaData[key]
				}
			})
			storyRepo.update(story.id, story).then(e => {
				Protocol.success(res)
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

	// Update Chapter Content
	app.put('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let content = req.body

		if (!Protocol.validateParams([chapterId, content])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findByChapterId(chapterId).then(story => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}
			let chapter = story.chapters.find(chapter => { return chapter.id == chapterId })
			chapterContentRepo.updateContent(chapter.URI, content).then(() => {
				Protocol.success(res)
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Chapter Content
	app.get('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let contentURIs = req.query.contentURIs

		if (!Protocol.validateParams([contentURIs])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let contentURIArray = JSON.parse(contentURIs)
		chapterContentRepo.findByIds(contentURIArray).then(contents => {
			let result = contents.map(c => StoryFunctions.toPublicContent(c))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_QUERY_FAIL"))
	})

}