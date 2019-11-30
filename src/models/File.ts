import * as mongoose from 'mongoose'

export interface IFileModel extends mongoose.Document {
    fileName: string
    fileType: string
    metaData?: object
    ownerId: string
    createdAt: number
    modifiedAt: number
}

export interface IPublicFile {
    id: string
    ownerId: string
    createdAt: number
    content?: string
}

export namespace FileFunctions {

    export function setFileName(fileModel: IFileModel, name: string): boolean {
        let regex = new RegExp('^[A-Za-z0-9_-]{4,15}$')
        if (!regex.test(name)) {
            return false
        }

        fileModel.fileName = name
        return true
    }

    export function setFileType(fileModel: IFileModel, fileType: string): boolean {
        fileModel.fileType = fileType
        return true
    }

    export function setFileMetaData(fileModel: IFileModel, metaData: object): boolean {
        fileModel.metaData = metaData
        return true
    }

    export function toPublicFile(fileModel: IFileModel): IPublicFile {
        let newPublicFile = <IPublicFile>{
            id: fileModel._id,
            ownerId: fileModel.ownerId,
            createdAt: fileModel.createdAt || 0
        }
        return newPublicFile
    }
}