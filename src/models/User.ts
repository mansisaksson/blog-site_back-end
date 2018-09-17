import * as mongoose from 'mongoose'
import * as bcrypt from 'bcrypt'
import { UserRepository } from '../Repositories';

export interface IUserModel extends mongoose.Document {
	username: string
	password: string
	createdAt: number
	modifiedAt: number
}

export interface IPublicUser {
	id: string
	username: string
	createdAt: number
}

export namespace UserFunctions {
	let userRepo = new UserRepository()

	export function setName(userModel: IUserModel, name: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let regex = new RegExp('^[A-Za-z0-9_-]{4,15}$')
			if (!regex.test(name)) {
				return reject("INVALID_USER_NAME")
			}
			
			userRepo.findUser(name).then(() => {
				reject("USER_ALREADY_EXISTS")
			}).catch(e => {
				userModel.username = name
				resolve()
			})
		})
	}

	export function setPassword(userModel: IUserModel, password: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$')
			if (!regex.test(password)) {
				return reject()
			}

			bcrypt.hash(password, 10, (err, hash) => {
				if (err) {
					reject(err)
				} else {
					userModel.password = hash
					resolve(hash)
				}
			})
		})
	}

	export function validatePassword(userModel: IUserModel, password: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			bcrypt.compare(password, userModel.password, (err, res) => {
				if (res) {
					resolve()
				} else {
					reject(err)
				}
			})
		})
	}

	export function toPublicUser(userModel: IUserModel): IPublicUser {
		let newPublicUser = <IPublicUser>{
			id: userModel._id,
			username: userModel.username || "",
			createdAt: userModel.createdAt || 0
		}
		return newPublicUser
	}

}
