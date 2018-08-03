import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, StoryChapterRepository, ChapterContentRepository } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel, IStoryChapterModel } from '../models'

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let storyChapterRepo = new StoryChapterRepository()
	let chapterContentRepo = new ChapterContentRepository()

	// Create Story
	app.post('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.query.title
		let chapter1Title = req.query.chapter1Title

		if (!Protocol.validateParams([userId, title, chapter1Title])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.createNewStory(title, userId).then((story: IStoryModel) => {
			chapterContentRepo.createNewChapterContent("").then(chapterContent => {
				storyChapterRepo.createNewChapter(chapter1Title, story.id, chapterContent.id).then(() => {
					let publicStory = StoryFunctions.toPublicStory(story)
					Protocol.success(res, publicStory)
				}).catch(e => Protocol.error(res, "STORY_CHAPTER_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CREATE_FAIL"))
	})

	// Delete Story
	app.delete('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyRepo.findById(storyId).then(story => {
			storyChapterRepo.deleteAll(story.chapterIds).then(() => {
				storyRepo.delete(story.id).then(() => {
					Protocol.success(res)
				}).catch(e => Protocol.error(res, "STORY_DELETE_FAIL", "Failed to delete story"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_DELETE_FAIL", "Failed to delete chapter"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL", "Could not find story"))
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
			let result = []
			stories.forEach(story => result.push(StoryFunctions.toPublicStory(story)))
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
			chapterContentRepo.createNewChapterContent("").then(chapterContent => {
				storyChapterRepo.createNewChapter(chapterTitle, storyId, chapterContent.id).then(chapter => {
					story.chapterIds.push(chapter.id)
					storyRepo.update(story.id, story).then(() => {
						let publicChapter = StoryFunctions.toPublicChapter(chapter)
						Protocol.success(res, publicChapter)
					}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
				}).catch(e => Protocol.error(res, "STORY_CHAPTER_CREATE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Delete Chapter
	app.delete('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

		if (!Protocol.validateParams([chapterId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyChapterRepo.findById(chapterId).then(chapter => {
			storyRepo.findById(chapter.id).then(story => {
				storyChapterRepo.delete(chapter.id).then(() => {
					story.chapterIds = story.chapterIds.filter(id => { return id == chapter.id })
					storyRepo.update(story.id, story).then(() => {
						Protocol.success(res)
					}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
				}).catch(e => Protocol.error(res, "STORY_CHAPTER_DELETE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_QUERY_FAIL"))
	})

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterIds = req.query.chapterIds

		if (!Protocol.validateParams([chapterIds])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyChapterRepo.findByIds(chapterIds).then((chapters: IStoryChapterModel[]) => {
			let result = []
			chapters.forEach(chapter => result.push(StoryFunctions.toPublicChapter(chapter)))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Update Chapter Content
	app.put('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let content = req.body

		if (!Protocol.validateParams([chapterId, content])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyChapterRepo.findById(chapterId).then(chapter => {
			chapterContentRepo.updateContent(chapter.URI, content).then(() => {
				Protocol.success(res)
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_QUERY_FAIL"))
	})

	// Update Chapter Meta Data
	app.put('/api/stories/chapters/metaData', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let newMetaData = req.body

		if (!Protocol.validateParams([chapterId, newMetaData])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		storyChapterRepo.findById(chapterId).then(chapter => {
			let properties = ['title']
			Object.keys(newMetaData).forEach(key => {
				if (properties.find(p => { return p === key })) {
					chapter[key] = newMetaData[key]
				}
			})
			storyChapterRepo.update(chapterId, chapter).then(e => {
				Protocol.success(res)
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_UPDATE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_QUERY_FAIL"))
	})
}