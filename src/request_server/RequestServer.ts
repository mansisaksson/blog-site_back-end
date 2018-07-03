import * as mongoose from 'mongoose';
import { ServerResponse } from './ServerResponse'
import { RequestProcessor } from './RequestProcessor'
import * as http from 'http';

export namespace RequestServer {
  export function start(port: number, rootDir: string) {
    /*
    * Open connection to database
    * If I've understood correctly it is preferred that you start an instance of the mongoose connection at the start
    * of your application and then reuse the existing connection across all threads/connections
    */
    let uri = 'mongodb://localhost/users';
    mongoose.connect(uri).then((Mongoose) => {
      console.log('Connected to MongoDb');
      /*
      * Server Responsible for handling requests
      */
      http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
        console.log("Received http request");
        console.log(request);

        let body = [];
        request.on('error', (err) => {
          kill_request(response, err);
        }).on('data', (chunk) => {
          body.push(chunk);
        }).on('end', () => {
          response.on('error', (err) => {
            return kill_request(response, err);
          });

          if (body.length <= 0) {
            return kill_request(response, new Error("http request is missing a body"));
          }

          let file = rootDir + request.url + '.js';
          RequestProcessor.ProcessRequest(body, file).then((serverResponse: ServerResponse) => {
            end_request(response, serverResponse);
          }).catch((err) => {
            kill_request(response, err);
          });
        });
      }).on("listen", () => {
        console.log('Started Request server on port: ' + port);
      }).on("close", () => {
        mongoose.disconnect();
      }).listen(port);
    }).catch((error) => {
      throw error
    })

    console.log('Started Request server on port: ' + port);
  }

  function kill_request(response: http.ServerResponse, err: Error) {
    console.error(err);
    var errorMessage = "Error: " + err.message;
    end_request(response, new ServerResponse(500, errorMessage, errorMessage));
  }

  function end_request(response: http.ServerResponse, serverResponse: ServerResponse) {
    response.statusCode = serverResponse.responseCode;
    response.statusMessage = serverResponse.responseMessage;
    response.setHeader('Content-Type', 'plain/text');
    response.write(serverResponse.getContent());
    response.end();
  }
}

