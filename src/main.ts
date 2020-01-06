import * as mongoose from 'mongoose'
import * as express from "express"
import * as session from 'express-session'
import * as bodyParser from 'body-parser'

//import * as Tests from './tests/test'
//(async function test() {
//	let testResult = await Tests.runTests()
//	if (!testResult) {
//		console.log("Tests failed")
//	}
//})();

(async function main() {
	var app = express()
	var listenServer = undefined

	var stopWebServer = () => {
		if (listenServer) {
			listenServer.close()
			listenServer = undefined
		}

		mongoose.disconnect()
	}

	var startWebServer = () => {
		var MongoStore = require('connect-mongo')(session)

		console.log("Starting Web Server!")

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

		// Sitemap used for search engine optimization
		require('./scripts/sitemap')(app)

		let server = app.listen(3000, function () {
			console.log("Server started!")
		}).on("close", function () {
			console.log("Server Closed!")
		})

		return server
	}

	let dev = true
	let dbURI = dev ? 'mongodb://localhost:27017' : 'mongodb://mongodb.mansisaksson.com:27017'
	var db = mongoose.connection

	db.on('connecting', function () {
		console.log('connecting to MongoDB...')
	});
	db.on('error', function (error) {
		console.error('Error in MongoDb connection: ' + error)
		stopWebServer()
	});
	db.on('connected', function () {
		console.log('MongoDB connected!')
		listenServer = startWebServer()
	});
	db.once('open', function () {
		console.log('MongoDB connection opened!')
	});
	db.on('reconnected', function () {
		console.log('MongoDB reconnected!')
	});
	db.on('disconnected', function () {
		console.log('MongoDB disconnected!')
		stopWebServer()
	})

	if (dev) {
		mongoose.connect(dbURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			dbName: "story_site",
			autoReconnect: true
		}).catch(e => { console.error(e) })
	} else {
		mongoose.connect(dbURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			user: "admin",
			pass: "1W4Ta2tKQ02K",
			dbName: "story_site",
			autoReconnect: true
		}).catch(e => { console.error(e) })
	}
})();
