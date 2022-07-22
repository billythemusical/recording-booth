const logger = (req, res, next) => {
  console.log(`LOGGER: ${req.originalUrl}`)
  next()
}

module.exports = logger
