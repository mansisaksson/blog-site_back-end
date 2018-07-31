import { Response } from 'express'

interface RequestResponse {
    success: boolean
    error_code: string
    error_message: string
    body: any
}

export namespace Protocol {
    export function success(expressResponse: Response, body?: any) {
        let response = <RequestResponse>{
            success: true,
            body: body
        }
        expressResponse.send(JSON.stringify(response))
        expressResponse.end()
    }

    export function error(expressResponse: Response, errorCode: string, errorMessage) {
        let response = <RequestResponse>{
            success: false,
            error_code: errorCode,
            error_message: errorMessage
        }
        expressResponse.send(JSON.stringify(response))
        expressResponse.end()
    }
}