var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://my.sms-smart.com/rest/send_sms?from=+639611573154&to=+639611573154&message=testing&username=9J3CtNdM&password=m4K1c25P'
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
