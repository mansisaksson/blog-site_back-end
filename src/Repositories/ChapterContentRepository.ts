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

	createNewChapterContent(content: string): Promise<IChapterContentModel> {
		return new Promise<IChapterContentModel>((resolve, reject) => {
			let chapterContent = <IChapterContentModel>{
				content: content
			}
			this.create(chapterContent).then((content: IChapterContentModel) => {
				resolve(content)
			}).catch(e => reject(e))
		})
	}

	updateContent(uri: string, content: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let newContent = <IChapterContentModel>{
				content: content
			}
			let id = this.toObjectId(uri)
			this.update(id, newContent).then(() => {
				resolve()
			}).catch(e => reject(e))
		})
	}
}
Object.seal(ChapterContentRepository)
