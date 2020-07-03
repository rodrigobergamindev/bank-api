const express = require('express')
const app = express()
const routes = require('./routes/accounts')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv/config')

const port = process.env.PORT || 5000
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(routes)


app.listen(port, () => console.log(`server on port ${port}`))
