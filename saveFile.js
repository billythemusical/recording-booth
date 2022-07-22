// Multer stores uploaded files to disk
const multer = require('multer')
const storage = multer.diskStorage({
	filename: function(req, file, cb) {
		const referenceFileName = `${req.body.username}:${req.body.email}:${req.body.fileName}`
		console.log('getting referenceFileName for storage:', referenceFileName)
		cb(null, referenceFileName)
	},
	destination: function(req, file, cb) {
		console.log('Multer is storing the uploaded file')
		cb(null, './upload')
	},
})

const saveFile = multer({ storage })

module.exports = saveFile
