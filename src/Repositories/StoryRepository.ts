import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IStoryModel } from '../models'

let schema = new mongoose.Schema({
	authorId: String,
	title: String,
	upvotes: Number,
	downvotes: Number,
	thumbnailURI: String,
	revision: Number,
	chapterURIs: [String],
	
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
		doc.revision += 1
	}
	next()
	return this
})

let StorySchema = mongoose.model<IStoryModel>('story', schema, 'stories', true);

export class StoryRepository extends RepositoryBase<IStoryModel>
{
	constructor() {
		super(StorySchema)
	}

	createNewStory(title: string, authorId: string): Promise<IStoryModel> {
		return new Promise<IStoryModel>((resolve, reject) => {
			let story = <IStoryModel>{
				authorId: authorId,
				title: title,
				upvotes: 0,
				downvotes: 0,
				thumbnailURI: "",
				revision: 0,
				chapterURIs: []
			}

			this.create(story).then((user: IStoryModel) => {
				resolve(user)
			}).catch(e => reject(e))
		})
	}
}
Object.seal(StoryRepository)
