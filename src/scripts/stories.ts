import { Request, Response, Express, NextFunction } from 'express'
import { StoryRepository, StoryChapterRepository } from '../Repositories'
import { UserFunctions, Protocol } from '../models';

module.exports = function (app: Express) {
	let storyRepo = new StoryRepository()
	let storyChapterRepo = new StoryChapterRepository()

	// Create Story
	app.post('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let userId = req.query.userId
		let title = req.query.title
		let chapter1Title = req.query.chapter1Title

	})

	// Delete Story
	app.delete('/api/stories', function (req: Request, res: Response, next: NextFunction) {
		let storyId = req.query.storyId

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
		let chapterURI = req.query.uri

	})

	// Get Chapters
	app.get('/api/stories/chapters', function (req: Request, res: Response, next: NextFunction) {
		let URIs = req.query.URIs

	})

	// Get Chapters
	app.get('/api/stories/chapters/metaData', function (req: Request, res: Response, next: NextFunction) {
		let uri = req.query.uri

	})
}