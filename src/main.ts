import { RequestServer } from './request_server/RequestServer'

__dirname;
RequestServer.start(3000, __dirname + '/auth_server/requests');