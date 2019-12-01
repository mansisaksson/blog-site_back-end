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

	export function setUserName(userModel: IUserModel, userName: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let regex = new RegExp('^[A-Za-z0-9_-]{4,15}$')
			if (!regex.test(userName)) {
				return reject("INVALID_USER_NAME")
			}

			userRepo.findUser(userName).then(() => {
				reject("USER_ALREADY_EXISTS")
			}).catch(e => {
				userModel.username = userName
				resolve()
			})
		})
	}

	export function setDisplayName(userModel: IUserModel, displayName: string): boolean {
		if (displayName == undefined || displayName.length > 40) {
			return false
		}
		userModel.displayName = displayName
		return true
	}

	export function setProfilePictureContent(userModel: IUserModel, newPictureContent: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			function getProfilePictureFile(): Promise<IFileModel> {
				return new Promise<IFileModel>((resolve, reject) => {
					fileRepository.findById(userModel.profilePictureURI).then(file => {
						resolve(file)
					}).catch(e => {
						fileRepository.createNewFile("profile_picture", "png", userModel._id.toHexString(), {}).then(file => {
							userModel.profilePictureURI = file._id.toHexString()
							resolve(file)
						}).catch(e => reject(e))
					})
				})
			}

			getProfilePictureFile().then((file) => {
				CDN.saveFile(file._id, newPictureContent).then(() => {
					resolve()
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	export function setBannerContent(userModel: IUserModel, newBannerContent: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			function getBannerFile(): Promise<IFileModel> {
				return new Promise<IFileModel>((resolve, reject) => {
					fileRepository.findById(userModel.bannerURI).then(file => {
						resolve(file)
					}).catch(e => {
						fileRepository.createNewFile("user_banner", "png", userModel._id.toHexString(), {}).then(file => {
							userModel.bannerURI = file._id.toHexString()
							resolve(file)
						}).catch(e => reject(e))
					})
				})
			}

			getBannerFile().then((file) => {
				CDN.saveFile(file._id, newBannerContent).then(() => {
					resolve()
				}).catch(e => reject(e))
			}).catch(e => reject(e))
		})
	}

	export function setDescription(userModel: IUserModel, description: string): boolean {
		if (description == undefined || description.length > 100) {
			return false
		}
		userModel.description = description
		return true
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
			displayName: userModel.displayName || "",
			profilePictureURI: userModel.profilePictureURI || "",
			bannerURI: userModel.bannerURI || "",
			description: userModel.description || "",
			createdAt: userModel.createdAt || 0
		}
		return newPublicUser
	}

}
