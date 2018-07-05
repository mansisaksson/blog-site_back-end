import * as mongoose from 'mongoose'
import * as express from "express"
import * as session from 'express-session'
var app = express()

let uri = 'mongodb://localhost/users'
mongoose.connect(uri).then((Mongoose) => {
	console.log("Connected to database!")

	app.set('trust proxy', 1) // trust first proxy
	app.use(session({
		secret: 'rFeshvHyphDvunfzKQubevCWRHBA4r3XXzJFA677EwZfkSTfPUB9D3eAb6cr2VDTcfVDERzHQagchwxYtnZ6n5NnDQP77HRjebMS',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: true }
	}))
	
	// Listen for user requests
	require('./scripts/users')(app)
	
	app.listen(3000, function () {
		console.log("Server started!")
	}).on("close", function() {
		console.log("Server Closed!")
		mongoose.disconnect()
	})
}).catch(e => { throw e })
