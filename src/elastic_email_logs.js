
const { local_connection } = require('../utils/db_connection');
const cron = require('node-cron');
var axios = require('axios');
const elastic_log = require('./elastic_email_logs_path');
let provider_code = {
    "PROVIDER_ELASTIC_EMAIL": "EMAIL10" //Elastic Email
};
let logid = 1;


async function getELasticEmailLogs(apiKey, country_code) {
    const now = new Date();
    //const from = new Date(now.getTime() - 60000).toISOString();  //every 1minute
    const from = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); //every 30mins
    const to = now.toISOString();
    //const from = '2023-04-22T18:05:40.845Z'; //static from
    //const to = '2023-04-22T18:30:40.845Z'; //static to
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.elasticemail.com/v2/log/events?statuses=0&apikey=${apiKey}&from=${from}&to=${to}`,
        headers: {}
    };

    try {
        // Make the HTTP request using Axios
        const response = await axios(config);

        response.data.data.recipients.forEach(data => {
            var data_json = data;
            data_json.date_created = new Date().toISOString();
            data_json.country_code = country_code;
            var constructed_json = { "logid": logid++, "data": data_json };
            elastic_log((JSON.stringify(constructed_json, null, 2)));

        });
    } catch (error) {
        console.error('API call failed:', error.message);
    }
};

local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${provider_code.PROVIDER_ELASTIC_EMAIL}' `).then(res => {
    const data = res.rows;
    data.forEach(async row => {

        const job = cron.schedule('*/30 * * * *', function () {
            getELasticEmailLogs(row.apikey, row.country_code)
        });
    });

})



