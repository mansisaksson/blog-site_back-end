import * as mongoose from 'mongoose'
import * as express from "express"
import * as session from 'express-session'
import * as bodyParser from 'body-parser'
var app = express()

let uri = 'mongodb://localhost/story_site'
mongoose.connect(uri).then((Mongoose) => {
	console.log("Connected to database!")

	// Use body parser
	app.use(bodyParser.text())

	// Enable sessions
	app.set('trust proxy', 1) // trust first proxy
	app.use(session({
		secret: 'rFeshvHyphDvunfzKQubevCWRHBA4r3XXzJFA677EwZfkSTfPUB9D3eAb6cr2VDTcfVDERzHQagchwxYtnZ6n5NnDQP77HRjebMS',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: true }
	}))

	// Log requests
	app.use(function (req, res, next) {
		console.log(req.method + ":" + req.url)
		next()
	})

	// Allow cross-origin requests
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*")
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
