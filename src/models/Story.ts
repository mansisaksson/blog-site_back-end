import * as mongoose from 'mongoose'

// *** Begin Story Chapter Model
export interface IStoryChapterModel extends mongoose.Document {
	title: string
	URI: string
	revision: number
	createdAt: number
	modifiedAt: number
}

export interface IPublicStoryChapter {
	chapterId: string
	storyId: string
	title: string
	URI: string
	revision: number
	createdAt: number
	modifiedAt: number
}
// *** End Story Chapter Model


// ** Begin Story Model
export interface IStoryModel extends mongoose.Document {
	authorId: string
	title: string
	accessibility: string,
	upvotes: number
	downvotes: number
	thumbnailURI: string
	createdAt: number
	modifiedAt: number
	revision: number
	chapters: IStoryChapterModel[]
}

export interface IPublicStory {
	storyId: string
	authorId: string
	title: string
	accessibility: string,
	upvotes: number
	downvotes: number
	thumbnailURI: string
	submittedAt: number
	lastUpdated: number
	revision: number
	chapters: IPublicStoryChapter[]
}
// ** End Story Model


// ** Begin Story Content
export interface IChapterContentModel extends mongoose.Document {
	content: string
}

export interface IPublicChapterContent {
	URI: string
	content: string
}
// ** End Story Content


export namespace StoryFunctions {

	export function toPublicStory(storyModel: IStoryModel): IPublicStory {
		let publicChapters: IPublicStoryChapter[]  = []
		storyModel.chapters.forEach(chapter => {
			publicChapters.push(this.toPublicChapter(storyModel.id, chapter))
		})

		return <IPublicStory>{
			storyId: storyModel._id,
			authorId: storyModel.authorId,
			title: storyModel.title,
			upvotes: storyModel.upvotes,
			downvotes: storyModel.downvotes,
			thumbnailURI: storyModel.thumbnailURI,
			submittedAt: storyModel.createdAt,
			lastUpdated: storyModel.modifiedAt,
			revision: storyModel.revision,
			chapters: publicChapters
		}
	}

	export function toPublicChapter(storyId: string, chapterModel: IStoryChapterModel): IPublicStoryChapter {
		return <IPublicStoryChapter>{
			chapterId: chapterModel._id,
			storyId: storyId,
			title: chapterModel.title,
			URI: chapterModel.URI,
			revision: chapterModel.revision,
			createdAt: chapterModel.createdAt,
			modifiedAt: chapterModel.modifiedAt,
		}
	}

	export function toPublicContent(contentModel: IChapterContentModel): IPublicChapterContent {
		return <IPublicChapterContent>{
			URI: contentModel._id,
			content: contentModel.content
		}
	}
	
}
