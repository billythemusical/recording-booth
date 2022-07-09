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

module.exports = upload
