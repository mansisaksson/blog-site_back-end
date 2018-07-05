import * as mongoose from 'mongoose'

export interface IUserModel extends mongoose.Document {
	name: string
	password: string
	createdAt: Date
	modifiedAt: Date
}

export class UserFunctions {

	private constructor() {
	}

	static setName(userModel: IUserModel, name: string) {
		// TODO: validate username (check for duplicates etc...)
		userModel.name = name
	}

	static setPassword(userModel: IUserModel, password: string) {
		// TODO: Hash password
		userModel.password = password
	}

	static validatePassword(userModel: IUserModel, password: string): boolean {
		return false
	}
	
}
