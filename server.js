const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const express = require('express')
const https = require('https')
const app = express()

// Load the port from our .env file
require('dotenv').config();
const port = process.env.PORT

// Get the certs for HTTPS
const key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
const cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');
const options = {
  key: key,
  cert: cert
};

// Multer stores uploaded files to disk
const multer = require('multer')
const storage = multer.diskStorage({
	filename: function(req, file, cb) {
		console.log('filename')
		const fileName = `${req.body.username}:${req.body.email}:${req.body.fileName}`
		cb(null, fileName)
	},
	destination: function(req, file, cb) {
		console.log('storage')
		cb(null, './upload')
	},
})
const upload = multer({ storage })

// Not sure why we need these two lines
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(bodyParser.json())

// Serve the static 'public' direcotry
app.use(express.static('public'))

// Setup a virtual URL to serve the '../upload' directory
// We need express.static to allow the files to be downloaded
app.use('/recordings',
  express.static(__dirname + '/upload'),
  serveIndex(__dirname + '/upload', { view: "details" })
)

// This is how we post a file to be uploaded
app.post('/upload', upload.single('file'), (req, res) => {
	console.log(req.body.name)
	console.log(req.file)
	const dataString = `${req.body.username}\n${req.body.email}\n${req.body.fileName}\n\n`
	try {
		fs.writeFileSync('./upload/_log.txt', dataString, {
			flag: 'a'
		})
	} catch (error) {
		console.error('Error writing to the log file:', error)
	}
	res.send({
		message: 'Successfully uploaded files',
    ok: true
	})
})


const server = https.createServer(options, app)

server.listen(port, function() {
	console.log('We are listening on port ' + port)
})
