import * as mongoose from 'mongoose'
import { FileRepository, CDN, StoryRepository } from '../Repositories'
import { IFileModel } from '../models'
import { ImageUtils } from '../utils/ImageUtils'

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
	friendlyId: string
	accessibility: string
	tags: string[],
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
	friendlyId: string
	title: string
	tags: string[]
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
	let storyRepository = new StoryRepository()

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

	export async function setFriendlyId(story: IStoryModel, newFriendlyId: string): Promise<boolean> {
		let foundStory = await storyRepository.findByFriendlyId(newFriendlyId)
		if (foundStory == undefined || foundStory.id == story.id) {
			let regex = new RegExp("[A-Za-z0-9_.\-~]") // Ensure id us url friendly
			if (!regex.test(newFriendlyId)) {
				return false
			}
			story.friendlyId = newFriendlyId
			return true
		}
		else {
			return false
		}
	}

	export function setTags(story: IStoryModel, newTags: string[]): boolean {
		if (!(newTags instanceof Array)) {
			return false;
		}
		story.tags = Array.from(new Set(newTags))
		return true;
	}

	export async function setThumbnailContent(story: IStoryModel, newThumbnailContent: string): Promise<boolean> {

		async function getThumbnailFile(): Promise<IFileModel> {
			let file: IFileModel = await fileRepository.findById(story.thumbnailURI)
			if (!file) {
				file = await fileRepository.createNewFile("thumbnail", "png", story.authorId, {})
				if (!file) {
					console.error("Failed to create thumbnail file!")
					return null
				}
				story.thumbnailURI = file._id.toHexString()
			}
			return file
		}

		let file = await getThumbnailFile()
		if (!file) {
			return false
		}

		let { base64Data, err } = await ImageUtils.formatImage_Base64(newThumbnailContent, 'png', { 
			width: 256, 
			height: 151,
			imageStretchMethod: ImageUtils.ImageStretchMethod.crop
		})
		if (err) {
			console.error(err)
			return false
		}

		return await CDN.saveFile(file._id, base64Data)
	}

	export async function setBannerContent(story: IStoryModel, newBannerContent: string): Promise<boolean> {
		async function getBannerFile(): Promise<IFileModel> {
			let file = await fileRepository.findById(story.bannerURI)
			if (!file) {
				file = await fileRepository.createNewFile("blog_banner", "png", story.authorId, {})
				if (!file) {
					console.error("Failed to create blog banner file!")
					return null
				}
				story.bannerURI = file._id.toHexString()
			}
			return file
		}

		let file = await getBannerFile()
		if (!file) {
			return false
		}

		let { base64Data, err } = await ImageUtils.formatImage_Base64(newBannerContent, 'png', { // Convert to png, and set max size to 1920 x 1080
			width: 1920,
			height: 1080,
			preserveAspectRatio: true,
			withoutEnlargement: true
		})
		if (err) {
			return false
		}

		return await CDN.saveFile(file._id, base64Data)
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
			friendlyId: storyModel.friendlyId || "",
			accessibility: storyModel.accessibility || "private",
			tags: storyModel.tags || [],
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
