
const axios = require('axios');
const https = require('https');


let config = {
    method: 'post',
    maxBodyLength: Infinity,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Add this line
    url: 'https://172.31.1.12:8069/Emailsender/api/',
    headers: {
        'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzkzODc4NDYsImp0aSI6InVMMTNaVG1ETndjRVh1TlF0dm43Y3c9PSIsImlzcyI6IiIsIm5iZiI6MTY3OTM4Nzg0NiwiZXhwIjoxNjc5Mzg4MjA2LCJkYXRhIjp7InVzZXJuYW1lIjoicmFpbiIsInBhc3N3b3JkIjoicG9naTY5Iiwic2l0ZV9rZXkiOiJxcXFxcTY5In19.vmVRS4_aaBGvx_kCQO_lga7LWgAFUgGWmLyWeIrLBBc',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'ci_session=7g0je7hbi3m7t0ci8u9aptsesg2emulm; ci_session=op66fru2jakdqclm23hn217n4n2o54ta'
    },
    data: {'id': '1','email': 'robert.gajelomo2321321331213@everlounge.net'}
};

axios.request(config)
    .then((response) => {
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {

        console.log(error);
    });
