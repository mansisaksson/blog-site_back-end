import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, StoryChapterRepository } from '../Repositories'
import { StoryFunctions, Protocol, IStoryModel } from '../models'

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let storyChapterRepo = new StoryChapterRepository()

	// Create Story
	app.post('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.query.title
		let chapter1Title = req.query.chapter1Title

		storyRepo.createNewStory(title, userId).then((story: IStoryModel) =>{
			storyChapterRepo.createNewChapter(chapter1Title, story.id).then(() => {
				let publicStory = StoryFunctions.toPublicStory(story)
				Protocol.success(res, publicStory)
			}).catch(e => {
				Protocol.error(res, "STORY_CHAPTER_ADD_FAIL", "Failed to add chapter to story")
			})
		}).catch(e => {
			Protocol.error(res, "STORY_ADD_FAIL", "Failed to create new story")
		})
	})

	// Delete Story
	app.delete('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

		storyRepo.findById(storyId).then(story => {
			storyChapterRepo.deleteAll(story.chapterIds).then(() => {
				storyRepo.delete(story.id).then(() => {
					Protocol.success(res)
				}).catch(e => {
					Protocol.error(res, "STORY_DELETE_FAIL", "Failed to delete story")
				})
			}).catch(e => {
				Protocol.error(res, "STORY_CHAPTER_DELETE_FAIL", "Failed to delete chapter")
			})
		}).catch(e => {
			Protocol.error(res, "STORY_QUERY_FAIL", "Could not find story")
		})
	})

	// Get Stories
	app.get('/api/stories/query', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let searchQuery = req.query.searchQuery

	})

	// Get Story
	app.get('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

	})

	// Update Story Title
	app.put('/api/stories/title', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let newTitle = req.body

	})


	// Create Chapter
	app.post('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId
		let chapterTitle = req.query.chapterTitle

	})

	// Delete Chapter
	app.delete('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

	})

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let chapterIds = req.query.chapterIds

	})

	// Update Chapter Content
	app.put('/api/stories/chapters/content', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

	})

	// Update Chapter
	app.put('/api/stories/chapters/metaData', function (req: Request, res: Response, next: NextFunction) {
		let chapterId = req.query.chapterId

	})
}