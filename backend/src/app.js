// The app.js file has only 2 tasks, to create the server and to config the server
// To config the server means to determine what all middlewares and API's are you using for your app

const express = require('express')
const cookieParser = require('cookie-parser')


const app = express()

app.use(express.json())
app.use(cookieParser())


/**
 * - Routes required
 */
const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.routes')


/**
 * - Use Routes
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)

module.exports = app
