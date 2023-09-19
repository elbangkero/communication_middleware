const { local_connection } = require('../../utils/db_connection');
const axios = require('axios');
 

async function apiAccount(country_code) {
    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${process.env.PROVIDER_SMS_SMART}' and country_code = '${country_code}' and environment = '${process.env.ENVIRONMENT}' LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { "username": row.username, "password": row.password };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { "username": "", "password": "" };
    }
}



async function SmartSMSSender(message, from, phone_number, country_code) {

    apiAccount(country_code);
    const encodedParamValueMessage = encodeURIComponent(message);
    const encodedParamValueFrom = encodeURIComponent(from);
    return new Promise(async (resolve, reject) => {
        const result = await apiAccount(country_code);
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://my.sms-smart.com/rest/send_sms?from=${encodedParamValueFrom}&to=${phone_number}&message=${encodedParamValueMessage}&username=${result.username}&password=${result.password}`
        };

        await axios(config)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                reject(error);
            });
    });

}



module.exports = { SmartSMSSender };