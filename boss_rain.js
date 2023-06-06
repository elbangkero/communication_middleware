const axios = require('axios'); 

var config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://13.229.158.52:8069/emailsender/api/1?email=robert.gajelomo123@everlounge.net',
    headers: { 
        'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzkzODc4NDYsImp0aSI6InVMMTNaVG1ETndjRVh1TlF0dm43Y3c9PSIsImlzcyI6IiIsIm5iZiI6MTY3OTM4Nzg0NiwiZXhwIjoxNjc5Mzg4MjA2LCJkYXRhIjp7InVzZXJuYW1lIjoicmFpbiIsInBhc3N3b3JkIjoicG9naTY5Iiwic2l0ZV9rZXkiOiJxcXFxcTY5In19.vmVRS4_aaBGvx_kCQO_lga7LWgAFUgGWmLyWeIrLBBc', 
        'Cookie': 'ci_session=qiie2l6mtsu39pe6mk1ie7tn83srb4om; ci_session=3qebtnrctcekndkrbmhl72peno56bs56; ci_session=t8uk6rdjibkkkf3v6enambu8qh58i330'
      }
};


axios(config)
    .then(function (response) {
     console.log('success');
    })
    .catch(function (error) {
        console.log('error');
    });