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

	// TODO: bodyParser.json, all komunikation bör göras genom json. För data bör jag enkoda datan i base64
	// och skicka det som ett json fält.
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
