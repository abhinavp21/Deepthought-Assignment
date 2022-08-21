const express = require('express')
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser')
const app = express()
const router = require('./routes')


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use("/api/v3/app/events", router)


app.listen(port, () => {
    console.log(`listening on port ${port}`);
})

