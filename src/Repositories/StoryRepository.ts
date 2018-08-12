import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IStoryModel, IStoryChapterModel } from '../models'

let chapterSchema = new mongoose.Schema({
	title: String,
	URI: String,
	revision: Number,

	createdAt: {
		type: Date,
		default: Date.now
	},
	modifiedAt: {
		type: Date,
		default: Date.now
	}
}).pre('save', function (next) {
	if (this._doc) {
		let doc = <IStoryChapterModel>this._doc
		let now = new Date()
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

let schema = new mongoose.Schema({
	authorId: String,
	title: String,
	upvotes: Number,
	downvotes: Number,
	thumbnailURI: String,
	revision: Number,
	chapters: [chapterSchema],

	createdAt: {
		type: Date,
		default: Date.now
	},
	modifiedAt: {
		type: Date,
		default: Date.now
	}
}).pre('save', function (next) {
	if (this._doc) {
		let doc = <IStoryModel>this._doc
		let now = new Date()
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

let StorySchema = mongoose.model<IStoryModel>('story', schema, 'stories', true)

export class StoryRepository extends RepositoryBase<IStoryModel>
{
	constructor() {
		super(StorySchema)
	}

	createNewStory(title: string, authorId: string, chapter1Title: string, contentURI): Promise<IStoryModel> {
		return new Promise<IStoryModel>((resolve, reject) => {
			let chapter = <IStoryChapterModel>{
				title: chapter1Title,
				URI: contentURI
			}

			let story = <IStoryModel>{
				authorId: authorId,
				title: title,
				upvotes: 0,
				downvotes: 0,
				thumbnailURI: "",
				revision: 0,
				chapters: [chapter]
			}

			this.create(story).then((user: IStoryModel) => {
				resolve(user)
			}).catch(e => reject(e))
		})
	}

	createNewChapter(storyId: string, chapterTitle: string, chapterContentURI: string): Promise<IStoryChapterModel> {
		return new Promise<IStoryChapterModel>((resolve, reject) => {
			this.findById(storyId).then(story => {
				let chapter = <IStoryChapterModel>{
					title: chapterTitle,
					URI: chapterContentURI
				}
				story.chapters.push(chapter)
				this.update(story.id, story).then(() => {
					resolve(story.chapters[story.chapters.length - 1])
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	findByChapterId(chapterId: string): Promise<IStoryModel> {
		return new Promise<IStoryModel>((resolve, reject) => {
			this.find({ "chapters._id": chapterId }, 1).then(story => {
				if (story != undefined && story.length > 0) {
					resolve(story[0])
				} else {
					reject()
				}
			}).catch(e => reject(e))
		})
	}

	findChapterById(chapterId: string): Promise<IStoryChapterModel> {
		return new Promise<IStoryChapterModel>((resolve, reject) => {
			this.findByChapterId(chapterId).then(story => {
				let foundChapter = story.chapters.filter(chapter => { return chapter.id == this.toObjectId(chapterId) })
				if (foundChapter != undefined && foundChapter.length > 0) {
					resolve(foundChapter[0])
				} else {
					reject()
				}
			}).catch(e => reject(e))
		})
	}

	updateChapterURI(chapterId: string, URI) : Promise<any> {
		return new Promise<any>((resolve, reject) => {
			this.findByChapterId(chapterId).then(story => {
				let chapterIndex = story.chapters.findIndex(chapter => { return chapter.id == chapterId })
				story.chapters[chapterIndex].URI = URI
				this.update(story.id, story).then(() => {
					resolve()
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	findChapters(chapterIds: string[]): Promise<IStoryChapterModel[]> {
		return new Promise<IStoryChapterModel[]>((resolve, reject) => {
			this.find({ "chapters._id": { $in : chapterIds } }, 1).then(stories => {
				let chapters = []
				stories.forEach(story => {
					story.chapters.forEach(chapter => {
						if (chapterIds.find(chapterId => { return chapterId == chapter.id })) {
							chapters.push(chapter)
						}
					})
				})
				resolve(chapters)
			}).catch(e => reject(e))
		})
	}
}
Object.seal(StoryRepository)