// The app.js file has only 2 tasks, to create the server and to config the server
// To config the server means to determine what all middlewares and API's are you using for your app

const express = require('express')
const authRouter = require('./routes/auth.routes')
const cookieParser = require('cookie-parser')


const app = express()

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRouter)

module.exports = app
