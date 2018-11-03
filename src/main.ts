import * as mongoose from 'mongoose'
import * as express from "express"
import * as session from 'express-session'
import * as bodyParser from 'body-parser'
var app = express()
var MongoStore = require('connect-mongo')(session)

let uri = 'mongodb://localhost/story_site'
mongoose.connect(uri).then((Mongoose) => {
	console.log("Connected to database!")

	// Use body parser
	app.use(bodyParser.json({
		limit: '50mb'
	}))

	// Enable sessions
	app.set('trust proxy', 1) // trust first proxy
	app.use(session({
		secret: 'rFeshvHyphDvunfzKQubevCWRHBA4r3XXzJFA677EwZfkSTfPUB9D3eAb6cr2VDTcfVDERzHQagchwxYtnZ6n5NnDQP77HRjebMS',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false },
		store: new MongoStore({ mongooseConnection: mongoose.connection })
	}))

	// Log requests
	app.use(function (req, res, next) {
		console.log("")
		console.log("*** Begin Request")
		console.log(req.method + ":" + req.url)
		next()
	})

	// Allow cross-origin requests
	app.use(function (req, res, next) {
		let origin = req.header("Origin")
		res.header("Access-Control-Allow-Origin", origin)
		res.header("Access-Control-Allow-Credentials", "true")
		res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With")
		next()
	})

	// Listen for file requests
	require('./scripts/files')(app)

	// Listen for user requests
	require('./scripts/users')(app)

	// Listen for story requests
	require('./scripts/stories')(app)

	app.listen(3000, function () {
		console.log("Server started!")
	}).on("close", function () {
		console.log("Server Closed!")
		mongoose.disconnect()
	})
}).catch(e => { throw e })

// TODO:
// process.stdin.resume();//so the program will not close instantly

// function exitHandler(options, exitCode) {
// 	console.log("******************************************** CLOSE ********************************************")
// 	mongoose.disconnect().then(() => {
// 		process.exit()
// 	}).catch(() => {
// 		process.exit()
// 	})
// }

// //do something when app is closing
// process.on('exit', exitHandler.bind(null, { cleanup: true }));

// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
// process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, { exit: true }));