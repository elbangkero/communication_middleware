const express = require("express")
const app = express();
const dotenv = require('dotenv');
const console_log = require('./src/log_file_path');
dotenv.config();
const cors = require('cors');
app.use(cors());
app.options('*', cors());
const jwt = require('jsonwebtoken');
require('./src/api')(app, jwt);
require('./src/jwt')(app, jwt);
require('./src/ftp_api')(app);
require('./src/views/index')(app);
require('./src/elastic_email_logs');


app.listen(`${process.env.PORT}`, () => {
  console_log('Listening on port ' + `${process.env.PORT}`);
});

app.get('/', (request, response) => {
  response.json({ info: 'Communication Middleware API' })
})


