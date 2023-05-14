if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const logger = require('morgan')
const app = express()
const cors = require('cors')
const chat = require('./api/chat')
const bodyParser = require('body-parser')

// temp. for testing
const indexRouter = require('./routes/index')
app.set('view engine', 'ejs')
app.use('/', indexRouter)

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(logger('dev'))
app.use(cors())
app.post('/chat', chat)

module.exports = app
