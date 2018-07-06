import * as mongoose from 'mongoose'

export interface IUserModel extends mongoose.Document {
	name: string
	password: string
	createdAt: Date
	modifiedAt: Date
}

export interface IPublicUser {
	id: string
	name: string
	createdAt: Date
}

export namespace UserFunctions {

	export function setName(userModel: IUserModel, name: string) {
		// TODO: validate username (check for duplicates etc...)
		userModel.name = name
	}

	export function setPassword(userModel: IUserModel, password: string) {
		// TODO: Hash password
		userModel.password = password
	}

	export function validatePassword(userModel: IUserModel, password: string): boolean {
		return false
	}

	export function toPublicUser(userModel: IUserModel): IPublicUser {
		let newPublicUser = <IPublicUser>{
			id: userModel.id,
			name: userModel.name,
			createdAt: userModel.createdAt
		}
		return newPublicUser
	}
	
}
