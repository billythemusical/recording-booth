const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const upload = require('./upload.js')
const auth = require('./auth.js')
const express = require('express')
const https = require('https')
const app = express()

// Load the port from our .env file
require('dotenv').config();
const port = process.env.PORT
const keyPath = process.env.KEY_PATH
const certPath = process.env.CERT_PATH

// Get the certs for HTTPS
const key = fs.readFileSync(__dirname + keyPath);
const cert = fs.readFileSync(__dirname + certPath);
const certs = {
  key: key,
  cert: cert
};

// For redirecting HTTP requests to HTTPS
app.enable('trust proxy')
app.use((req, res, next) => {
    req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
})

// Not sure why we need these two lines
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Serve the static 'public' direcotry
app.use(express.static('public'))

// Setup a virtual URL to serve the '../upload' directory
// We need express.static to allow the files to be downloaded
app.use('/recordings', auth,
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

// For redirecting http requests to https
app.listen(80, function() {
	console.log('We are listening on port ' + 80)
});

// For https service
const server = https.createServer(certs, app)
server.listen(port, function() {
	console.log('We are listening on port ' + port)
})
