import * as mongoose from 'mongoose'
import * as bcrypt from 'bcrypt'
import { UserRepository, FileRepository, CDN } from '../Repositories';
import { IFileModel } from '../models'

export interface IUserModel extends mongoose.Document {
	username: string
	displayName: string
	profilePictureURI: string
	bannerURI: string
	description: string
	password: string
	createdAt: number
	modifiedAt: number
}

export interface IPublicUser {
	id: string
	username: string
	displayName: string
	profilePictureURI: string
	bannerURI: string
	description: string
	createdAt: number
}

export namespace UserFunctions {
	let userRepo = new UserRepository()
	let fileRepository = new FileRepository()

	export async function setUserName(userModel: IUserModel, userName: string): Promise<{ success: boolean, err?: string }> {
		let regex = new RegExp('^[A-Za-z0-9_-]{4,15}$')
		if (!regex.test(userName)) {
			console.log("INVALID_USER_NAME")
			return { success: false, err: "INVALID_USER_NAME" }
		}

		let user = await userRepo.findUser(userName)
		if (user) {
			console.log("USER_ALREADY_EXISTS")
			return { success: false, err: "USER_ALREADY_EXISTS" }
		}
		userModel.username = userName
		return { success: true }
	}

	export function setDisplayName(userModel: IUserModel, displayName: string): boolean {
		if (displayName == undefined || displayName.length > 40) {
			return false
		}
		userModel.displayName = displayName
		return true
	}

	export async function setProfilePictureContent(userModel: IUserModel, newPictureContent: string): Promise<boolean> {
		async function getProfilePictureFile(): Promise<IFileModel> {
			let file = await fileRepository.findById(userModel.profilePictureURI)
			if (!file) {
				file = await fileRepository.createNewFile("profile_picture", "png", userModel._id.toHexString(), {})
				if (!file) {
					return null
				}
				userModel.profilePictureURI = file._id.toHexString()
			}
			return file
		}

		let file = await getProfilePictureFile()
		if (!file) {
			return false
		}
		return await CDN.saveFile(file._id, newPictureContent)
	}

	export async function setBannerContent(userModel: IUserModel, newBannerContent: string): Promise<boolean> {
		async function getBannerFile(): Promise<IFileModel> {
			let file = await fileRepository.findById(userModel.bannerURI)
			if (!file) {
				file = await fileRepository.createNewFile("user_banner", "png", userModel._id.toHexString(), {})
				if (!file) {
					return null
				}
				userModel.bannerURI = file._id.toHexString()
			}
			return file
		}

		let file = await getBannerFile()
		if (!file) {
			return false
		}
		return await CDN.saveFile(file._id, newBannerContent)
	}

	export function setDescription(userModel: IUserModel, description: string): boolean {
		if (description == undefined || description.length > 100) {
			return false
		}
		userModel.description = description
		return true
	}

	export async function setPassword(userModel: IUserModel, password: string): Promise<{ hashedPassword: string, err?: string }> {
		let regex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$')
		if (!regex.test(password)) {
			return { hashedPassword: "", err: "INVALID_PASSWORD" }
		}

		try {
			let hash = bcrypt.hashSync(password, 10)
			return { hashedPassword: hash }
		} catch (error) {
			console.log(error)
			return { hashedPassword: "", err: "FAILED_TO_HASH_PASSWORD" }
		}
	}

	export function validatePassword(userModel: IUserModel, password: string): boolean {
		try {
			return bcrypt.compareSync(password, userModel.password)
		} catch (error) {
			console.log(error)
			return false
		}
	}

	export function toPublicUser(userModel: IUserModel): IPublicUser {
		let newPublicUser = <IPublicUser>{
			id: userModel._id,
			username: userModel.username || "",
			displayName: userModel.displayName || "",
			profilePictureURI: userModel.profilePictureURI || "",
			bannerURI: userModel.bannerURI || "",
			description: userModel.description || "",
			createdAt: userModel.createdAt || 0
		}
		return newPublicUser
	}

}
