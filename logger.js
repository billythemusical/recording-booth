const logger = (req, res, next) => {
  console.log(req.originalUrl)
  next()
}

module.exports = logger
