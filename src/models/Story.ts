import * as mongoose from 'mongoose'
import { FileRepository, CDN } from '../Repositories'
import { IFileModel } from '../models'

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
	description: string
	accessibility: string
	upvotes: number
	downvotes: number
	thumbnailURI: string
	bannerURI: string
	createdAt: number
	modifiedAt: number
	revision: number
	chapters: IStoryChapterModel[]
}

export interface IPublicStory {
	storyId: string
	authorId: string
	description: string
	title: string
	accessibility: string,
	upvotes: number
	downvotes: number
	thumbnailURI: string
	bannerURI: string
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
	let fileRepository = new FileRepository()

	export function setStoryTitle(story: IStoryModel, newTitle: string): boolean {
		if (newTitle === undefined) {
			return false
		}
		// TODO: Validate title
		story.title = newTitle
		return true
	}

	export function setStoryDescription(story: IStoryModel, newDescription: string): boolean {
		if (newDescription === undefined) {
			return false
		}
		console.log("----- DESC: ")
		console.log(newDescription)
		// TODO: Validate description
		story.description = newDescription
		return true
	}

	export function setStoryAccesibility(story: IStoryModel, newAccesibility: string): boolean {
		if (!newAccesibility) {
			return false
		}
		let allowedAccesibility = ['public', 'private', 'unlisted']
		if (!allowedAccesibility.find(e => e == newAccesibility)) {
			return false
		}
		story.accessibility = newAccesibility
		return true
	}

	export function setThumbnailContent(story: IStoryModel, newThumbnailContent: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			function getThumbnailFile(): Promise<IFileModel> {
				return new Promise<IFileModel>((resolve, reject) => {
					fileRepository.findById(story.thumbnailURI).then(file => {
						resolve(file)
					}).catch(e => {
						fileRepository.createNewFile("thumbnail", "png", story.authorId, {}).then(file => {
							story.thumbnailURI = file._id.toHexString()
							resolve(file)
						}).catch(e => reject(e))
					})
				})
			}

			getThumbnailFile().then((file) => {
				CDN.saveFile(file._id, newThumbnailContent).then(() => {
					resolve()
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	export function setBannerContent(story: IStoryModel, newBannerContent: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			function getBannerFile(): Promise<IFileModel> {
				return new Promise<IFileModel>((resolve, reject) => {
					fileRepository.findById(story.bannerURI).then(file => {
						resolve(file)
					}).catch(e => {
						fileRepository.createNewFile("blog_banner", "png", story.authorId, {}).then(file => {
							story.bannerURI = file._id.toHexString()
							resolve(file)
						}).catch(e => reject(e))
					})
				})
			}

			getBannerFile().then((file) => {
				CDN.saveFile(file._id, newBannerContent).then(() => {
					resolve()
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	export function rearrangeChapters(story: IStoryModel, chapterArrangement: string[]): boolean {
		if (!chapterArrangement) {
			return false
		}

		if (story.chapters.length != chapterArrangement.length) {
			return false
		}

		let newChapterArray: IStoryChapterModel[] = []
		chapterArrangement.forEach(chapterId => {
			let index = story.chapters.findIndex(chapter => chapterId == chapter._id)
			if (index == -1) { // Make sure the chapter actually exists
				return false
			}

			newChapterArray.push(story.chapters[index])
		})

		story.chapters = newChapterArray
		return true
	}

	export function toPublicStory(storyModel: IStoryModel): IPublicStory {
		let publicChapters: IPublicStoryChapter[] = []
		storyModel.chapters.forEach(chapter => {
			publicChapters.push(this.toPublicChapter(storyModel.id, chapter))
		})

		return <IPublicStory>{
			storyId: storyModel._id,
			authorId: storyModel.authorId,
			title: storyModel.title || "",
			description: storyModel.description || "",
			accessibility: storyModel.accessibility || "private",
			upvotes: storyModel.upvotes || 0,
			downvotes: storyModel.downvotes || 0,
			thumbnailURI: storyModel.thumbnailURI || "",
			bannerURI: storyModel.bannerURI || "",
			submittedAt: storyModel.createdAt || 0,
			lastUpdated: storyModel.modifiedAt || 0,
			revision: storyModel.revision || 0,
			chapters: publicChapters || []
		}
	}

	export function toPublicChapter(storyId: string, chapterModel: IStoryChapterModel): IPublicStoryChapter {
		return <IPublicStoryChapter>{
			chapterId: chapterModel._id,
			storyId: storyId,
			title: chapterModel.title || "",
			URI: chapterModel.URI || "",
			revision: chapterModel.revision || 0,
			createdAt: chapterModel.createdAt || 0,
			modifiedAt: chapterModel.modifiedAt || 0,
		}
	}

	export function toPublicContent(contentModel: IChapterContentModel): IPublicChapterContent {
		return <IPublicChapterContent>{
			URI: contentModel._id,
			content: contentModel.content || ""
		}
	}

}
