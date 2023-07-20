const fs = require( 'fs' )
const path = require( 'path' )
const bodyParser = require( 'body-parser' )
const serveIndex = require( 'serve-index' )
const ejsLint = require('ejs-lint')
const saveFile = require( './saveFile.js' )
const logger = require( './logger.js' )
const auth = require( './auth.js' )
const {
	db,
	getData,
	addData,
	deleteData
} = require( './datastore.js' )
const { deleteFile } = require('./deleteFile.js')
const clientDeleteFile = require('./clientDeleteFile.js')
const express = require( 'express' )
const https = require( 'https' )
const app = express()

// Load the port from our .env file
require( 'dotenv' )
	.config();
const port = process.env.PORT
const keyPath = process.env.KEY_PATH
const certPath = process.env.CERT_PATH

// This helps with the EJS errors
// const ejsOptions = { async: true }
ejsLint();

// Get the certs for HTTPS
const key = fs.readFileSync( keyPath );
const cert = fs.readFileSync( certPath );
const certs = {
	key: key,
	cert: cert
};

// Test Delete object
// const dataToDelete = {
// 		"referenceFileName": "Test Test:test@test.com:2022-07-10T15:40:59.734Z.wav"
// 	}

//Testing the delete DATA from database function
// console.log( "testing delete DATA (before)..." )
// const testDelete = deleteData( dataToDelete )
// 	.then( data => console.log( "testing delete DATA (after)...", data ) )
// 	.catch( err => console.log( "ERROR: unable to run testDelete", err ) )

//Testing the delete FILE from database function
// console.log( "testing delete FILE (before)..." )
// const testFileDelete = deleteFile(dataToDelete)
//   .then( data => console.log( "testing delete FILE (after)...", data ) )
//   .catch( err => console.log( "ERROR: unable to run testFileDelete", err ) )

// For redirecting HTTP requests to HTTPS
app.enable( 'trust proxy' )
// For logging requests
app.use( logger )
app.use( ( req, res, next ) => {
	req.secure ? next() : res.redirect( 'https://' + req.headers.host + req.url )
} )

// Not sure why we need these two lines
app.use( bodyParser.urlencoded( { extended: false } ) )

app.use( bodyParser.json() )

// Serve the static 'public' direcotry
app.use( '/incorrigibles', express.static( 'public' ) )

// Setup a virtual URL to serve the '../upload' directory
// We need express.static to allow the files to be downloaded
// app.use('/rec', auth,
// express.static(__dirname + '/upload')
// serveIndex(__dirname + '/upload', { view: "details" })
// )

app.use( '/rec', auth, express.static( __dirname + '/upload' ),
	// serveIndex(__dirname + '/upload', { view: "details" })
)

// Using EJS to render the database
app.set( 'view engine', 'ejs' )
app.get( '/recordings', auth, async ( req, res ) => {
	const recordingsList = await getData()
		.then( data => {
			res.render( 'recordings/index', {
				recordings: data,
        // clientDeleteFile: clientDeleteFile,
			} )
		} )
} )

// This is how we post a file to be uploaded
app.post( '/upload', saveFile.single( 'file' ), ( req, res ) => {

	const dataToStore = req.body
	dataToStore.referenceFileName = `${req.body.username}:${req.body.email}:${req.body.fileName}`

	console.log( 'dataToStore:', dataToStore )

	try {

		// We have to add this so the file name on disk matches the database file name
		addData( dataToStore )

		// If we wanna do a text log backup
		const textToWrite = `${req.body.username}\n${req.body.email}\n${req.body.fileName}\n\n`
		fs.writeFileSync( './upload/_log.txt', textToWrite, { flag: 'a' } )

	} catch ( error ) {
		console.error( 'Error writing to the log file:', error )
	}
	res.send( {
		message: 'Successfully uploaded files',
		ok: true
	} )
} )

app.delete( '/delete', auth, deleteFile)

// For redirecting http requests to https
app.listen( 80, function() {
	console.log( 'We are listening on port ' + 80 )
} );

// For https service
const server = https.createServer( certs, app )
server.listen( port, function() {
	console.log( 'We are listening on port ' + port )
} )
