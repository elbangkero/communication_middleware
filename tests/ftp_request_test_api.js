const axios = require('axios');

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.txtlocal.com/send/?apiKey=QIWAfdFYpxo-wnML8HC8oBMJHPrbgwnI992twih6my&numbers=639611573154&message=testing TextLocal Rhoy&sender=rhoy',
  headers: { 
    'Cookie': 'PHPSESSID=jtenbp0mn67tsfcor7g1l22mh6'
  }
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
