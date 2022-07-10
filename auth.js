require('dotenv').config()
const authorizedUsers = (JSON.parse(process.env.AUTH_USERS)).users

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
