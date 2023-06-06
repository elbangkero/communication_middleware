const axios = require('axios');
const FormData = require('form-data');
const https = require('https'); 

let config = {
    method: 'get',
    maxBodyLength: Infinity,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Add this line
    url: 'https://13.229.158.52:8069/emailsender/api/1?email=efrain.jorque@gmail.com',
    headers: {
        'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzkzODc4NDYsImp0aSI6InVMMTNaVG1ETndjRVh1TlF0dm43Y3c9PSIsImlzcyI6IiIsIm5iZiI6MTY3OTM4Nzg0NiwiZXhwIjoxNjc5Mzg4MjA2LCJkYXRhIjp7InVzZXJuYW1lIjoicmFpbiIsInBhc3N3b3JkIjoicG9naTY5Iiwic2l0ZV9rZXkiOiJxcXFxcTY5In19.vmVRS4_aaBGvx_kCQO_lga7LWgAFUgGWmLyWeIrLBBc',
        'Cookie': 'ci_session=qiie2l6mtsu39pe6mk1ie7tn83srb4om; ci_session=3qebtnrctcekndkrbmhl72peno56bs56; ci_session=mu2rfjorbt95nbgqpu0jncf9mu807nla'
    }
};

axios.request(config)
    .then((response) => {
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
        console.log(error);
    });

