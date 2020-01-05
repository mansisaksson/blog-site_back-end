import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IChapterContentModel } from '../models';

let schema = new mongoose.Schema({
	content: String
})

let ChapterContentSchema = mongoose.model<IChapterContentModel>('story_chapter_content', schema, 'story_chapters_content', true)

export class ChapterContentRepository extends RepositoryBase<IChapterContentModel>
{
	constructor() {
		super(ChapterContentSchema)
	}

	async createNewChapterContent(content: string): Promise<IChapterContentModel> {
		let chapterContent = <IChapterContentModel>{
			content: content
		}
		return await this.create(chapterContent)
	}

	async updateContent(uri: string, content: string): Promise<boolean> {
		let newContent = <IChapterContentModel>{
			content: content
		}

		return await this.update(this.toObjectId(uri), newContent)
	}
}
Object.seal(ChapterContentRepository)
