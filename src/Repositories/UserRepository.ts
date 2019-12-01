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

	createNewUser(name: string, password: string): Promise<IUserModel> {
		return new Promise<IUserModel>((resolve, reject) => {
			let user = <IUserModel>{
				username: name,
				password: password
			}

			this.create(user).then((user: IUserModel) => {
				resolve(user)
			}).catch(e => reject(e))
		})
	}

	findUser(name: string): Promise<IUserModel> {
		return new Promise<IUserModel>((resolve, reject) => {
			this.find({ username: name }, 1).then(users => {
				let result = users.length > 0 ? <IUserModel>users[0] : undefined
				if (result != undefined) {
					resolve(result)
				} else {
					reject()
				}
			}).catch(e => reject(e))
		})
	}

	findUsers(name: string, limit: number): Promise<IUserModel[]> {
		return new Promise<IUserModel[]>((resolve, reject) => {
			this.find({ name: name }, limit).then(users => {
				resolve(users)
			}).catch(e => reject(e))
		})
	}
}
Object.seal(UserRepository)
