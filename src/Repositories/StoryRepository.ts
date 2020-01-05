import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IStoryModel, IStoryChapterModel } from '../models'

// Chapter Model
let chapterSchema = new mongoose.Schema({
	title: String,
	URI: String,
	revision: Number,
	createdAt: Number,
	modifiedAt: Number
}).pre('save', function (this: any, next: mongoose.HookNextFunction, docs: any[]) {
	if (this._doc) {
		let doc = <IStoryChapterModel>this._doc
		let now = Date.now()
		if (!doc.createdAt) {
			doc.createdAt = now
		}
		doc.modifiedAt = now

		if (!doc.revision) {
			doc.revision = 0
		} else {
			doc.revision += 1
		}
	}
	next()
	return this
})

// Story Model
let schema = new mongoose.Schema({
	authorId: String,
	title: String,
	friendlyId: {
		type: String,
		unique: true
	},
	description: String,
	tags: [String],
	accessibility: String,
	upvotes: Number,
	downvotes: Number,
	thumbnailURI: String,
	bannerURI: String,
	revision: Number,
	chapters: [chapterSchema],

	createdAt: Number,
	modifiedAt: Number
}).pre('save', function (this: any, next: mongoose.HookNextFunction, docs: any[]) {
	if (this._doc) {
		let doc = <IStoryModel>this._doc

		if (!doc.accessibility) {
			doc.accessibility = 'private'
		}

		let now = Date.now()
		if (!doc.createdAt) {
			doc.createdAt = now
		}
		doc.modifiedAt = now

		if (!doc.revision) {
			doc.revision = 0
		} else {
			doc.revision += 1
		}

		if (!doc.bannerURI) {
			doc.bannerURI = ''
		}
	}
	next()
	return this
})

let StorySchema = mongoose.model<IStoryModel>('story', schema, 'stories', true)

export interface StoryQuery {
	title?: string,
	searchingUser?: string
	limitToAuthorId?: string
	resultLimit?: number
}

export class StoryRepository extends RepositoryBase<IStoryModel>
{
	constructor() {
		super(StorySchema)
	}

	// override RepositoryBase findById
	async findById(id: string): Promise<IStoryModel> {
		let mgdbQuery = this.isId(id) ? {
			$or: [
				{ _id: this.toObjectId(id) },
				{ friendlyId: id }
			]
		} : { friendlyId: id }

		let stories = await this.find(mgdbQuery, 1)
		if (stories != undefined && stories != null && stories.length > 0) {
			return stories[0]
		}

		return null
	}

	async findByFriendlyId(friendlyId: string): Promise<IStoryModel> {
		let mgdbQuery = { friendlyId: friendlyId }

		let stories = await this.find(mgdbQuery, 1)
		if (stories != undefined && stories != null && stories.length > 0) {
			return stories[0]
		} else {
			return null
		}
	}

	async createNewStory(title: string, authorId: string, chapter1Title: string, contentURI): Promise<IStoryModel> {
		let chapter = <IStoryChapterModel>{
			title: chapter1Title,
			URI: contentURI
		}

		let story = <IStoryModel>{
			authorId: authorId,
			title: title,
			accessibility: 'private',
			upvotes: 0,
			downvotes: 0,
			thumbnailURI: "",
			bannerURI: "",
			revision: 0,
			chapters: [chapter]
		}

		return await this.create(story)
	}

	async createNewChapter(storyId: string, chapterTitle: string, chapterContentURI: string): Promise<IStoryChapterModel> {
		let story = await this.findById(storyId)
		if (!story) {
			return null
		}

		let chapter = <IStoryChapterModel>{
			title: chapterTitle,
			URI: chapterContentURI
		}
		story.chapters.push(chapter)

		if (await this.update(story.id, story)) {
			return story.chapters[story.chapters.length - 1]
		}

		return null
	}

	async findByAuthorId(authorId: string): Promise<IStoryModel[]> {
		let stories = await this.find({ authorId: authorId }, 1)
		if (stories == undefined || stories == null) {
			return []
		}
		return stories
	}

	async searchForStories(query: StoryQuery): Promise<IStoryModel[]> {
		let authorIdQuery = ".*" + (query.limitToAuthorId ? query.limitToAuthorId : "") + ".*"
		let titleQuery = ".*" + (query.title ? query.title : "") + ".*"

		let mgdbQuery = {
			title: { $regex: titleQuery },
			$and: [{
				$or: [
					{ accessibility: 'public' },
					{ authorId: query.searchingUser }
				]
			}, { authorId: { $regex: authorIdQuery } }
			]
		}
		return await this.find(mgdbQuery, query.resultLimit ? query.resultLimit : 100)
	}

	async findByChapterId(chapterId: string): Promise<IStoryModel> {
		let stories = await this.find({ "chapters._id": chapterId }, 1)
		if (stories == undefined || stories == null || stories.length == 0) {
			return null
		}
		return stories[0]
	}

	async findChapterById(chapterId: string): Promise<IStoryChapterModel> {
		let story = await this.findByChapterId(chapterId)
		if (!story) {
			return null
		}

		let foundChapter = story.chapters.filter(chapter => { return chapter.id == this.toObjectId(chapterId) })
		if (!foundChapter || foundChapter.length == 0) {
			return null
		}

		return foundChapter[0]
	}

	async updateChapterURI(chapterId: string, URI): Promise<boolean> {
		let story = await this.findByChapterId(chapterId)
		if (!story) {
			return false
		}

		let chapterIndex = story.chapters.findIndex(chapter => { return chapter.id == chapterId })
		story.chapters[chapterIndex].URI = URI
		if (!await this.update(story.id, story)) {
			return false
		}
		return true
	}

	async findChapters(chapterIds: string[]): Promise<IStoryChapterModel[]> {
		let stories = await this.find({ "chapters._id": { $in: chapterIds } }, 1)
		if (!stories) {
			return []
		}
		let chapters = []
		stories.forEach(story => {
			story.chapters.forEach(chapter => {
				if (chapterIds.find(chapterId => { return chapterId == chapter.id })) {
					chapters.push(chapter)
				}
			})
		})
	}
}
Object.seal(StoryRepository)
