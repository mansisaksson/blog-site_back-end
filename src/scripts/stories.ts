import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, ChapterContentRepository, } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel, IStoryChapterModel, IPublicStoryChapter, IFileModel } from '../models'
import { isArray } from 'util';

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let chapterContentRepo = new ChapterContentRepository()

	// Create Story
	app.post('/api/stories', async function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.body['title'] ? req.body['title'] : "Default Title"
		let chapter1Title = req.body['chapter1Title'] ? req.body['chapter1Title'] : "Default Chapter Title"

		if (!Protocol.validateParams([userId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		if (!Protocol.validateUserSession(req, userId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		// Create new story
		{
			let chapterContent = await chapterContentRepo.createNewChapterContent("")
			if (!chapterContent) {
				return Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL")
			}

			let story = await storyRepo.createNewStory(title, userId, chapter1Title, chapterContent.id)
			if (!story) {
				return Protocol.error(res, "STORY_CREATE_FAIL")
			}
			Protocol.success(res, StoryFunctions.toPublicStory(story))
		}
	})

	// Update Story
	app.put('/api/stories', async function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let newStoryProperties: any = req.body

		if (!Protocol.validateParams([storyId, newStoryProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story: IStoryModel = await storyRepo.findById(storyId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

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
			if (!await StoryFunctions.setThumbnailContent(story, newStoryProperties['thumbnail'])) {
				return Protocol.error(res, "INVALID_STORY_THUMBNAIL")
			}
		}

		if (newStoryProperties['banner']) {
			if (!await StoryFunctions.setBannerContent(story, newStoryProperties['banner'])) {
				return Protocol.error(res, "INVALID_STORY_BANNER")
			}
		}

		if (!await storyRepo.update(storyId, story)) {
			return Protocol.error(res, "STORY_UPDATE_FAIL")
		}
		
		Protocol.success(res, StoryFunctions.toPublicStory(story))
	})

	// Delete Story
	app.delete('/api/stories', async function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story = await storyRepo.findById(storyId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

		if (!Protocol.validateUserSession(req, story.authorId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		// Delete story content
		let URIs = []
		story.chapters.forEach(chapter => URIs.push(chapter.URI))
		if (!chapterContentRepo.deleteAll(URIs)) {
			return Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL")
		}

		// Delete story
		if (!storyRepo.delete(story.id)) {
			return Protocol.error(res, "STORY_DELETE_FAIL")
		}

		// TODO: Delete story thumbnail and banner

		Protocol.success(res)
	})

	// Get Stories
	app.get('/api/stories/query', async function (req: Request, res: Response, next: NextFunction) {
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

		let stories = await storyRepo.searchForStories({
			title: query,
			limitToAuthorId: idQuery,
			searchingUser: userSessionId
		})

		if (stories == undefined || stories == null) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

		Protocol.success(res, stories.map(s => StoryFunctions.toPublicStory(s)))
	})

	// Get Story
	app.get('/api/stories', async function (req: Request, res: Response, next: NextFunction) {
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

		let story = await storyRepo.findById(storyId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}
		Protocol.success(res, StoryFunctions.toPublicStory(story))
	})

	// Create Chapter
	app.post('/api/stories/chapters', async function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let chapterTitle = req.body['title'] ? req.body['title'] : 'Default Title'

		if (!Protocol.validateParams([storyId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story = await storyRepo.findById(storyId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

		if (!Protocol.validateUserSession(req, story.authorId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		let chapterContent = await chapterContentRepo.createNewChapterContent("")
		if (!chapterContent) {
			return Protocol.error(res, "STORY_CHAPTER_CONTENT_CREATE_FAIL")
		}

		let chapter = await storyRepo.createNewChapter(storyId, chapterTitle, chapterContent.id)
		if (!chapter) {
			return Protocol.error(res, "STORY_CHAPTER_CREATE_FAIL")
		}

		Protocol.success(res, StoryFunctions.toPublicChapter(story.id, chapter))
	})

	// Update Chapter
	app.put('/api/stories/chapters', async function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let newChapterProperties = req.body

		if (!Protocol.validateParams([chapterId, newChapterProperties])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story = await storyRepo.findByChapterId(chapterId)
		if (!story) {
			return Protocol.error(res, "STORY_CHAPTER_QUERY_FAIL")
		}
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
		if (!await storyRepo.update(story.id, story)) {
			return Protocol.error(res, "STORY_UPDATE_FAIL")
		}
		Protocol.success(res, StoryFunctions.toPublicChapter(story._id, story.chapters[chapterIndex]))
	})

	// Delete Chapter
	app.delete('/api/stories/chapters', async function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

		if (!Protocol.validateParams([chapterId])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story = await storyRepo.findByChapterId(chapterId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

		if (!Protocol.validateUserSession(req, story.authorId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		let chapter = story.chapters.find(chapter => { return chapter.id == chapterId })
		if (!await chapterContentRepo.delete(chapter.URI)) {
			return Protocol.error(res, "STORY_CHAPTER_CONTENT_DELETE_FAIL")
		}

		story.chapters = story.chapters.filter(chapter => { return chapter.id != chapterId })
		if (!await storyRepo.update(story.id, story)) {
			return Protocol.error(res, "STORY_UPDATE_FAIL")
		}
		Protocol.success(res, StoryFunctions.toPublicStory(story))
	})

	// Get Chapters
	app.get('/api/stories/chapters', async function (req: Request, res: Response, next: NextFunction) {
		let storyIds = req.query.chapterIds

		if (!Protocol.validateParams([storyIds])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// Only one id, so not passed as an array
		if (!isArray(storyIds)) {
			storyIds = [storyIds]
		}

		// TODO: Don't return if private

		let chapters = await storyRepo.findChapters(storyIds)
		if (chapters == undefined || chapters == null) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}
		let result: IPublicStoryChapter[] = []
		chapters.forEach(async c => {
			let story = await storyRepo.findByChapterId(c._id)
			if (!story) {
				console.log("Error: Found a chapter without a valid story!")
			} else {
				result.push(StoryFunctions.toPublicChapter(story._id, c))
			}
		})
		Protocol.success(res, result)
	})

	// Update Chapter Content
	app.put('/api/stories/chapters/content', async function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId
		let content = req.body['content'] ? req.body['content'] : ""

		if (!Protocol.validateParams([chapterId, content])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		let story = await storyRepo.findByChapterId(chapterId)
		if (!story) {
			return Protocol.error(res, "STORY_QUERY_FAIL")
		}

		if (!Protocol.validateUserSession(req, story.authorId)) {
			return Protocol.error(res, "INSUFFICIENT_PERMISSIONS")
		}

		let chapter = story.chapters.find(chapter => { return chapter.id == chapterId })
		if (!await chapterContentRepo.updateContent(chapter.URI, content)) {
			return Protocol.error(res, "STORY_CHAPTER_CONTENT_UPDATE_FAIL")
		}

		Protocol.success(res, { URI: chapter.URI })
	})

	// Get Chapter Content
	app.get('/api/stories/chapters/content', async function (req: Request, res: Response, next: NextFunction) {
		let contentURIs = req.query.contentURIs

		if (!Protocol.validateParams([contentURIs])) {
			return Protocol.error(res, "INVALID_PARAM")
		}

		// Only one id, so not passed as an array
		if (!isArray(contentURIs)) {
			contentURIs = [contentURIs]
		}

		// TODO: Do not allow access if private

		let contents = await chapterContentRepo.findByIds(contentURIs)
		if (contents == undefined || contents == null) {
			return Protocol.error(res, "STORY_CHAPTER_CONTENT_QUERY_FAIL")
		}
		Protocol.success(res, contents.map(c => StoryFunctions.toPublicContent(c)))
	})

}