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
	storyId: string
	authorId: string
	title: string
	upvotes: number
	downvotes: number
	thumbnailURI: string
	submittedAt: number
	lastUpdated: number
	revision: number
	//chapters: ChapterMetaData[]
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

	export function toPublicStory(storyModel: IStoryModel): IPublicStory {
		return <IPublicStory>{
			storyId: storyModel.id,
			authorId: storyModel.authorId,
			title: storyModel.title,
			upvotes: storyModel.upvotes,
			downvotes: storyModel.downvotes,
			thumbnailURI: storyModel.thumbnailURI,
			submittedAt: storyModel.createdAt.getTime(),
			lastUpdated: storyModel.modifiedAt.getTime(),
			revision: storyModel.revision,
			//chapters: ChapterMetaData[]
		}
	}

	export function toPublicChapter(chapterModel: IStoryChapterModel): IPublicStoryChapter {
		return <IPublicStoryChapter>{
			//TODO
		}
	}
	
}
