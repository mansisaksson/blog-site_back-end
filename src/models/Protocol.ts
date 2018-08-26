import { Response, Request } from 'express'
import { IUserModel } from './User';
import { resolve } from 'url';

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
    console.log("*** End Request")
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
    console.log("*** End Request")
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

  export function getUserSession(expressRequest: Request): IUserModel {
    let user = <IUserModel>expressRequest.session.user
    return user
  }

  export function validateUserSession(expressRequest: Request, userId: string): boolean {
    let user = <IUserModel>expressRequest.session.user
    return user != undefined && user._id == userId
  }

  export function createUserSession(expressRequest: Request, user: IUserModel): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      expressRequest.session.user = user
      expressRequest.session.save((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  export function destroyUserSession(expressRequest: Request): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      expressRequest.session.user = undefined;
      expressRequest.session.save((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}