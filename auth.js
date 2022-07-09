const authorizedUsers = [
  "alison.cornyn@gmail.com",
  "bennett.billy@gmail.com"
]

const auth = (req, res, next) => {
  const reject = () => {
   res.setHeader('www-authenticate', 'Basic')
   res.sendStatus(401)
  }

  const authorization = req.headers.authorization

  if(!authorization) {
    return reject()
  }

  const [username, password] = Buffer.from(authorization.replace('Basic ', ''), 'base64').toString().split(':')

  if(! (authorizedUsers.includes(username) && password === 'incorrigibles')) {
    return reject()
  }

  next()
}

module.exports = auth
