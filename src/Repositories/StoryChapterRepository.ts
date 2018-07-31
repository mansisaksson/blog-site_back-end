import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IStoryChapterModel } from '../models'

let schema = new mongoose.Schema({
	storyId: String,
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
		doc.revision += 1
	}
	next()
	return this
})

let StoryChapterSchema = mongoose.model<IStoryChapterModel>('story_chapter', schema, 'story_chapters', true);

export class StoryChapterRepository extends RepositoryBase<IStoryChapterModel>
{
	constructor() {
		super(StoryChapterSchema)
	}

	createNewChapter(title: string, storyId: string): Promise<IStoryChapterModel> {
		return new Promise<IStoryChapterModel>((resolve, reject) => {
			let story = <IStoryChapterModel>{
				storyId: storyId,
				title: title,
				URI: "",
			}

			this.create(story).then((user: IStoryChapterModel) => {
				resolve(user)
			}).catch(e => reject(e))
		})
	}
}
Object.seal(StoryChapterRepository)
