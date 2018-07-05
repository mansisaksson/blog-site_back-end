import * as mongoose from 'mongoose'
import { RepositoryBase } from './RepositoryBase'
import { IUserModel } from './../models/User'

export let Schema = mongoose.Schema;

let schema = new Schema({
	name: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		required: false
	},
	modifiedAt: {
		type: Date,
		required: false
	}
}).pre('save', function (next) {
	if (this._doc) {
		let doc = <IUserModel>this._doc;
		let now = new Date();
		if (!doc.createdAt) {
			doc.createdAt = now;
		}
		doc.modifiedAt = now;
	}
	next();
	return this;
});

export let UserSchema = mongoose.model<IUserModel>('user', schema, 'users', true);

export class UserRepository extends RepositoryBase<IUserModel>
{
	constructor() {
		super(UserSchema);
	}

	createNewUser(name: string, password: string): Promise<IUserModel> {
		return new Promise<IUserModel>((resolve, reject) => {
			let user = <IUserModel>{
				name: name,
				password: password
			}

			this.create(user).then((user: IUserModel) => {
				resolve(user)
			}).catch(e => reject(e))
		})
	}

	findUser(name: string): Promise<IUserModel> {
		return new Promise<IUserModel>((resolve, reject) => {
			this.find({ name: name }).sort({ createdAt: -1 }).limit(1).exec((err, res) => {
				if (err) {
					reject(err)
				} else {
					resolve(res.length > 0 ? <IUserModel>res[0] : undefined)
				}
			})
		})
	}

	findUsers(name: string, limit: number): Promise<IUserModel[]> {
		return new Promise<IUserModel[]>((resolve, reject) => {
			this.find({ name: name }).sort({ createdAt: -1 }).limit(limit).exec((err, res) => {
				if (err) {
					reject(err)
				} else {
					let outUsers: IUserModel[] = [] // TODO: is pre-allocating an array a thing in js?
					res.forEach(result => {
						outUsers.push(<IUserModel>result)
					})
					resolve(outUsers)
				}
			})
		})
	}
}
Object.seal(UserRepository);