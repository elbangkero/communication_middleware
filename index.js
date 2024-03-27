const express = require("express");
const app = express();
const dotenv = require('dotenv');
const console_log = require('./src/log_file_path');
dotenv.config();
const cors = require('cors');
app.use(cors());
app.options('*', cors());
const jwt = require('jsonwebtoken');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

require('./src/api')(app, jwt);
require('./src/jwt')(app, jwt);
require('./src/views/index')(app);
//require('./src/elastic_email_logs');
require('./src/custom_site_api/cron_callback_api');
require('./src/log_file_zip');

app.listen(`${process.env.PORT}`, () => {
  console_log('CMW listening on port : ' + `${process.env.PORT}`);
});

app.get('/', (request, response) => {
  response.json({ info: 'Communication Middleware API' })
});


const app2 = express();
app2.use(cors());
app2.options('*', cors());
require('./src/ants_callback')(app2);

const PORT2 = parseInt(process.env.PORT) + 1;
app2.listen(PORT2, () => {
  console_log('Ants-Callback listening on port : ' + PORT2);
});


app.post('/upload/upload-config', (req, res) => {
  proxy.web(req, res, {
    target: `http://${process.env.SERVER_IP}:8043`
  }, err => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy Error');
  });
});