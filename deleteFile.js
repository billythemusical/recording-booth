const fs = require( 'fs' )
const { promisify } = require( 'util' )
const dir = "./upload/"

const deleteFile = async ( req, res, next ) => {
	try {
		const referenceFileName = req.body.referenceFileName
		const fileToDelete = dir + referenceFileName
		console.log( "File to delete is", fileToDelete )
		await fs.unlink( fileToDelete, function () {})
    res.status(200).send('The server has deleted the file.')//.redirect(req.get('referer'))
	} catch ( error ) {
    console.log( 'ERROR: The server is unable to delete file, error is:', error )
		res.status(400).send('ERROR: The server is unable to delete file, error is:', error)
	}
  next()
}

module.exports = { deleteFile: deleteFile }
