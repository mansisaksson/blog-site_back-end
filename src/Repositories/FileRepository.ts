import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IFileModel } from '../models/File'

let schema = new mongoose.Schema({
	fileName: {
		type: String,
		required: true
	},
	fileType: {
		type: String,
		required: true
	},
	metaData: {
		type: Object,
		required: false
	},
	createdAt: {
		type: Number,
		required: false
	},
	modifiedAt: {
		type: Number,
		required: false
	}
}).pre('save', function (this: any, next: mongoose.HookNextFunction, docs: any[]) {
	if (this._doc) {
		let doc = <IFileModel>this._doc
		let now = Date.now()
		if (!doc.createdAt) {
			doc.createdAt = now
		}
		doc.modifiedAt = now
	}
	next()
	return this
})

let FileSchema = mongoose.model<IFileModel>('file', schema, 'files', true)

export class FileRepository extends RepositoryBase<IFileModel> {

	constructor() {
		super(FileSchema)
	}

	createNewFile(fileName: string, fileType: string, ownerId: string, metaData?: object): Promise<IFileModel> {
		return new Promise<IFileModel>((resolve, reject) => {
			// TODO: verify ownerId

			let file = <IFileModel>{
				fileName: fileName,
				fileType: fileType,
				metaData: metaData,
				ownerId: ownerId
			}

			this.create(file).then((file: IFileModel) => {
				resolve(file)
			}).catch(e => reject(e))
		})
	}

}