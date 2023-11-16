const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const ejsLint = require('ejs-lint')
const saveFile = require('./saveFile.js')
const logger = require('./logger.js')
const auth = require('./auth.js')
const {
	db,
	getData,
	addData,
	deleteData
} = require('./datastore.js')
const { deleteFile } = require('./deleteFile.js')
const clientDeleteFile = require('./clientDeleteFile.js')
const express = require('express')
const app = express()

// Load the port from our .env file
require('dotenv').config();
const port = process.env.PORT

// This helps with the EJS errors
// const ejsOptions = { async: true }
ejsLint();

// For redirecting HTTP requests to HTTPS
app.enable('trust proxy')
// For logging requests
app.use(logger)
// app.use( ( req, res, next ) => {
// 	req.secure ? next() : res.redirect( 'https://' + req.headers.host + req.url )
// } )

// Not sure why we need these two lines
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

// Serve the static 'public' directory
app.use('/incorrigibles', express.static('public'))

app.use('/rec', auth, express.static(__dirname + '/upload'),
	// serveIndex(__dirname + '/upload', { view: "details" })
)

// Using EJS to render the database
app.set('view engine', 'ejs')
app.get('/recordings', auth, async (req, res) => {
	const recordingsList = await getData()
		.then(data => {
			res.render('recordings/index', {
				recordings: data,
				// clientDeleteFile: clientDeleteFile,
			})
		})
})

// This is how we post a file to be uploaded
app.post('/upload', saveFile.single('file'), (req, res) => {

	const dataToStore = req.body
	dataToStore.referenceFileName = `${req.body.username}:${req.body.email}:${req.body.fileName}`

	console.log('dataToStore:', dataToStore)

	try {

		// We have to add this so the file name on disk matches the database file name
		addData(dataToStore)

		// If we wanna do a text log backup
		const textToWrite = `${req.body.username}\n${req.body.email}\n${req.body.fileName}\n\n`
		fs.writeFileSync('./upload/_log.txt', textToWrite, { flag: 'a' })

	} catch (error) {
		console.error('Error writing to the log file:', error)
	}
	res.send({
		message: 'Successfully uploaded files',
		ok: true
	})
})

app.delete('/delete', auth, deleteFile)

app.listen(port, function () {
	console.log(`We are listening on port ${port}`)
});

