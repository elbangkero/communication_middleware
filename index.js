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
require('./src/ftp_api')(app);
require('./src/views/index')(app);
require('./src/elastic_email_logs');


app.listen(`${process.env.PORT}`, () => {
  console_log('Listening on port ' + `${process.env.PORT}`);
});

app.get('/', (request, response) => {
  response.json({ info: 'Communication Middleware API' })
})

app.post("/generate-token", (req, res) => {

  let jwtSecretKey = process.env.JWT_SECRET_KEY;
  let data = {
    "Issuer": "Issuer",
    "Issued At": "2023-08-15T08:11:01.365Z",
    "Expiration": "2023-08-15T08:11:01.365Z",
    "Username": "JavaInUse",
    "Role": "Admin"
  }
  const token = jwt.sign(data, jwtSecretKey);

  res.send(token);
});

app.get("/validate-token", (req, res) => {
  let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  let jwtSecretKey = process.env.JWT_SECRET_KEY;

  try {
    const token = req.header(tokenHeaderKey);

    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      return res.send("Successfully Verified");
    } else {
      return res.status(401).send(error);
    }
  } catch (error) {
    return res.status(401).send(error);
  }
});