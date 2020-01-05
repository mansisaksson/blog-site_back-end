import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IUserModel } from '../models/User'

let schema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	displayName: {
		type: String,
		required: false,
		unique: false
	},
	profilePictureURI: {
		type: String,
		required: false
	},
	bannerURI: {
		type: String,
		required: false
	},
	description: {
		type: String,
		required: false
	},
	password: {
		type: String,
		required: true
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
		let doc = <IUserModel>this._doc
		let now = Date.now()
		if (!doc.createdAt) {
			doc.createdAt = now
		}
		doc.modifiedAt = now
	}
	next()
	return this
})

let UserSchema = mongoose.model<IUserModel>('user', schema, 'users', true)

export class UserRepository extends RepositoryBase<IUserModel>
{
	constructor() {
		super(UserSchema)
	}

	async createNewUser(name: string, password: string): Promise<IUserModel> {
		let user = <IUserModel>{
			username: name,
			password: password
		}
		return await this.create(user)
	}

	async findUser(name: string): Promise<IUserModel> {
		let users = await this.find({ username: name }, 1)
		if (!users || users.length == 0) {
			return null
		}
		return users[0]
	}

	async findUsers(name: string, limit: number): Promise<IUserModel[]> {
		let users = await this.find({ name: name }, limit)
		if (!users) {
			return []
		}
		return users
	}
}
Object.seal(UserRepository)
