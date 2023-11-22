const axios = require('axios');

async function VitruvianAPI(token) {

  return new Promise(async (resolve, reject) => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://afun-playerinfo-ap-prod.vitruviandata.com/player?token=${token}`,
      headers: {
        'Authorization': 'Basic bmltYnVzOndeN3FCUCpOJlRaZQ=='
      }
    };

    axios.request(config)
      .then((response) => {
        resolve({
          'email': response.data.results[0].profile.email,
          'phone_number': response.data.results[0].profile.phoneNumber,
          'classificationcode': response.data.results[0].tags,
          'brandcode': response.data.results[0].info.siteCode,
          'country': response.data.results[0].profile.country,
          'playername': response.data.results[0].profile.firstName + ' ' + response.data.results[0].profile.lastName
        });
      })
      .catch((error) => {
        reject(error);
      });
  });

}

async function VITRUVIAN(player_token) {
  await VitruvianAPI(player_token)
    .then(async function (response) {
      console.log(response);

    })
    .catch(async function (err) {
    }).finally(async function () {

    });
}


VITRUVIAN('s2tnnlvy074288');




