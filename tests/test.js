const axios = require('axios');
let msg = '{"error":{"message":"updateBalance"}}';

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://chat.googleapis.com/v1/spaces/AAAA3kY0_3c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=OyB9SAe8ncudmNjP7WtX4XZ5szes4cWfiG0u58HejdM',
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cookie': 'COMPASS=dynamite-integration=CgAQ0rCWtgYaTQAJa4lXEMJ_fYXhHgLEYndozdzwMVA36P_k9s2w7I8cdYpBB7AlKyFweqLWHKW5zrJdc2Rmqx_Ve23FTjx5cTN3usKmMVAk-FKwPmeJMAE'
  },
  data: { "text": msg }
};

axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
