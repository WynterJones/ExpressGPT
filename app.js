if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const logger = require('morgan')
const app = express()
const cors = require('cors')
const chat = require('./api/chat')
const bodyParser = require('body-parser')
app.use(bodyParser.json())

app.use(logger('dev'))
app.use(cors())

app.post('/chat', chat)

module.exports = app
