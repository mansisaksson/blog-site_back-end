import * as fs from 'fs'

export namespace FileRepository {
	export function saveImage_Base64(base64Data: string, resizeOptions?: { width: number, height: number }): string {
		return FileRepository.saveImage(atob(base64Data), resizeOptions)
	}

	export function saveImage(data: string, resizeOptions?: { width: number, height: number }): string {
		return ""
	}

	export function loadFile(fileId: string): string {
		return ""
	}

	export function loadFileAsBase64(fileId: string): string {
		return ""
	}
}