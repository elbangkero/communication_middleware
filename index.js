const express = require("express") 
const app = express(); 
const dotenv = require('dotenv');
dotenv.config();    

require('./src/api');

 
app.listen(`${process.env.PORT}`, () => {
  console.log('Listening on port ' + `${process.env.PORT}`);
});

app.get('/', (request, response) => {
  response.json({ info: 'Communication Middleware API' })
})  
 
