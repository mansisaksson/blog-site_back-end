import { ServerResponse } from './ServerResponse'

export namespace RequestProcessor {
    export function ProcessRequest(data: any[], path): Promise<ServerResponse> {
        return new Promise<ServerResponse>((resolve, reject) => {
            console.log("Executing request: " + path)
            try {
                var requestScript = require(path)
            } catch (error) {
                return reject(new Error("Could not Find request: " + path))
            }

            // Parse the input data
            try {
                interface IRequestSession {
                    SessionToken: string
                    Params: Map<any, any>
                }

                var requestSession: IRequestSession = <IRequestSession>new Object()
                requestSession.Params = new Map<any, any>()
                let jsonBody = Buffer.concat(data).toString()
                JSON.parse(jsonBody, (key, value) => {
                    requestSession.Params.set(key, value)
                })
            } catch (error) {
                return reject(new Error("Failed to parse input parameters"))
            }

            // Try Execute the script file
            try {
                requestScript.run(requestSession).then((result) => {
                    return resolve(new ServerResponse(200, "success", result))
                }).catch(error => {
                    return reject(error)
                })
            } catch (error) {
                return reject(error)
            }
        })
    }
}