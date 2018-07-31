import * as mongoose from 'mongoose'

/// *** Story Model
export interface IStoryModel extends mongoose.Document {
	authorId: string
	title: string
	upvotes: number
	downvotes: number
	thumbnailURI: string
	createdAt: Date
	modifiedAt: Date
	revision: number
	chapterIds: string[]
}

export interface IPublicStory {
	id: string
	name: string
	createdAt: Date
}

/// *** Story Chapter Model
export interface IStoryChapterModel extends mongoose.Document {
	storyId: string
	title: string
	URI: string
	revision: number
	createdAt: Date
	modifiedAt: Date
}

export interface IPublicStoryChapter {
	id: string
	name: string
	createdAt: Date
}

export namespace StoryFunctions {

	export function toPublicStory(userModel: IStoryModel): IPublicStory {
		return <IPublicStory>{
			//TODO
		}
	}
	
}
