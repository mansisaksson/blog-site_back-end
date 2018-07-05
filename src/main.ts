import * as express from "express"
import * as session from 'express-session'
var app = express()

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'rFeshvHyphDvunfzKQubevCWRHBA4r3XXzJFA677EwZfkSTfPUB9D3eAb6cr2VDTcfVDERzHQagchwxYtnZ6n5NnDQP77HRjebMS',
  resave: false,
  saveUninitialized: true,
	cookie: { secure: true }
}))

app.get('/', function(req: express.Request, res: express.Response, next) {
	req.session['test'] = 100

	next()
})

app.all('/', function(req, res) {

})

app.listen(3000,  function () {
	console.log("Server started!")
})