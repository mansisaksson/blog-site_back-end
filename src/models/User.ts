import * as mongoose from 'mongoose'

export interface IUserModel extends mongoose.Document {
	username: string
	password: string
	createdAt: Date
	modifiedAt: Date
}

export interface IPublicUser {
	id: string
	username: string
	createdAt: number
}

export namespace UserFunctions {

	export function setName(userModel: IUserModel, name: string) {
		// TODO: validate username (check for duplicates etc...)
		userModel.username = name
	}

	export function setPassword(userModel: IUserModel, password: string) {
		// TODO: Hash password
		userModel.password = password
	}

	export function validatePassword(userModel: IUserModel, password: string): boolean {
		return userModel.password === password
	}

	export function toPublicUser(userModel: IUserModel): IPublicUser {
		let newPublicUser = <IPublicUser>{
			id: userModel._id,
			username: userModel.username,
			createdAt: userModel.createdAt.getTime()
		}
		return newPublicUser
	}
	
}
