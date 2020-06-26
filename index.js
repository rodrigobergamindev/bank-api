const express = require('express')
const port = process.env.PORT || 5000
const app = express()
const routes = require('./routes/accounts')
const bodyParser = require('body-parser')
const cors = require('cors')


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use(routes)


app.listen(port, () => console.log(`server on port ${port}`))