import * as mongoose from 'mongoose'

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

	export function setName(userModel: IUserModel, name: string): boolean {
		if (!name) {
			return false
		}

		let regex = new RegExp('^[A-Za-z0-9_-]{4,15}$')
		if (regex.test(name)) {
			userModel.username = name
			return true
		}
		
		return false
	}

	export function setPassword(userModel: IUserModel, password: string): boolean {
		if (!password) {
			return false
		}

		let regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$')
		if (regex.test(password)) {
			userModel.password = password
			return true
		} 
		
		return false
	}

	export function validatePassword(userModel: IUserModel, password: string): boolean {
		return userModel.password === password
	}

	export function toPublicUser(userModel: IUserModel): IPublicUser {
		let newPublicUser = <IPublicUser>{
			id: userModel._id,
			username: userModel.username,
			createdAt: userModel.createdAt
		}
		return newPublicUser
	}
	
}
