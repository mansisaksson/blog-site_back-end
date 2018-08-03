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
        let jsonResponse = JSON.stringify(response)
        console.log(jsonResponse)
        expressResponse.send(jsonResponse)
        expressResponse.end()
    }

    export function error(expressResponse: Response, errorCode: string, errorMessage?) {
        let response = <RequestResponse>{
            success: false,
            error_code: errorCode,
            error_message: errorMessage
        }
        let jsonResponse = JSON.stringify(response)
        console.log(jsonResponse)
        expressResponse.send(jsonResponse)
        expressResponse.end()
    }

    export function validateParams(params: any[]): boolean {
        let returnValue = true;
        params.forEach(param => {
            if (param === undefined || param === 'undefined' || typeof param === 'undefined') {
                returnValue = false
            }
        })
        return returnValue
    }
}