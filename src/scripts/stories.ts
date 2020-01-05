import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, ChapterContentRepository, } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel, IStoryChapterModel, IPublicStoryChapter, IFileModel } from '../models'
import { isArray } from 'util';

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

		storyRepo.findById(storyId).then(async (story: IStoryModel) => {
			if (!Protocol.validateUserSession(req, story.authorId)) {
				return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
			}

			if (newStoryProperties['title']) {
				if (!StoryFunctions.setStoryTitle(story, newStoryProperties.title)) {
					return Protocol.error(res, "INVALID_STORY_TITLE")
				}
			}

			if (newStoryProperties['description']) {
				if (!StoryFunctions.setStoryDescription(story, newStoryProperties.description)) {
					return Protocol.error(res, "INVALID_STORY_DESCRIPTION")
				}
			}

			if (newStoryProperties['accessibility']) {
				if (!StoryFunctions.setStoryAccesibility(story, newStoryProperties.accessibility)) {
					return Protocol.error(res, "INVALID_STORY_ACCESSIBILITY")
				}
			}

			if (newStoryProperties['tags'] != undefined) {
				if (!StoryFunctions.setTags(story, newStoryProperties.tags)) {
					return Protocol.error(res, "INVALID_STORY_TAGS")
				}
			}

			if (newStoryProperties['chapters']) {
				if (!StoryFunctions.rearrangeChapters(story, newStoryProperties.chapters)) {
					return Protocol.error(res, "INVALID_STORY_ARRANGEMENT")
				}
			}

			if (newStoryProperties['friendlyId']) {
				if (!await StoryFunctions.setFriendlyId(story, newStoryProperties['friendlyId'])) {
					return Protocol.error(res, "INVALID_STORY_FRIENDLY_ID")
				}
			}

			if (newStoryProperties['thumbnail']) {
				try	{ 
					await StoryFunctions.setThumbnailContent(story, newStoryProperties['thumbnail'])
				}
				catch (e) {
					return Protocol.error(res, "INVALID_STORY_THUMBNAIL")
				}
			}

			if (newStoryProperties['banner']) {
				try	{ 
					await StoryFunctions.setBannerContent(story, newStoryProperties['banner'])
				}
				catch (e) {
					return Protocol.error(res, "INVALID_STORY_BANNER")
				}
			}

			storyRepo.update(storyId, story).then(() => {
				Protocol.success(res, StoryFunctions.toPublicStory(story))
			}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
				
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

		storyRepo.searchForStories({ 
			title: query,
			limitToAuthorId: idQuery,
			searchingUser: userSessionId
		}).then((stories: IStoryModel[]) => {
			let result = stories.map(s => StoryFunctions.toPublicStory(s))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Story
	app.get('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// TODO: Don't return if private
		// let userSession = Protocol.getUserSession(req)
		// let userSessionId = ''
		// if (userSession) {
		// 	userSessionId = userSession._id
		// }

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
					Protocol.success(res, StoryFunctions.toPublicStory(story))
				}).catch(e => Protocol.error(res, "STORY_UPDATE_FAIL"))
			}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL"))
		}).catch(e => Protocol.error(res, "STORY_QUERY_FAIL"))
	})

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyIds = req.query.chapterIds

		if (!Protocol.validateParams([storyIds])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// Only one id, so not passed as an array
		if (!isArray(storyIds)) {
			storyIds = [storyIds]
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

		// Only one id, so not passed as an array
		if (!isArray(contentURIs)) {
			contentURIs = [contentURIs]
		}

		// TODO: Do not allow access if private
		chapterContentRepo.findByIds(contentURIs).then(contents => {
			let result = contents.map(c => StoryFunctions.toPublicContent(c))
			Protocol.success(res, result)
		}).catch(e => Protocol.error(res, "STORY_CHAPTER_CONTENT_QUERY_FAIL"))
	})

}