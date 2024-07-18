const ControllerSMSMKT = require('.././Http/Controller/Provider/ControllerSMSMKT');
const _ControllerSMSMKT = new ControllerSMSMKT();
const axios = require('axios');
const qs = require('qs');


const PROVIDER_SMS_MKT = process.env.PROVIDER_SMS_MKT;


async function API_Account(PROVIDER_SMS_MKT, country_code) {

    const res = await _ControllerSMSMKT.GetSMSMKTAccount(PROVIDER_SMS_MKT, country_code);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { "api_key": row.apikey, "secret_key": row.md5key };
        })
    );

    if (results.length > 0) {
        return results[0];
    } else {
        return { "api_key": "", "secret_key": "" };
    }

}

async function SMSMKTSMSSender(sender, message, phone, country_code) {

    const result = await API_Account(PROVIDER_SMS_MKT, country_code);

    return new Promise(async (resolve, reject) => {

        if (result.api_key === '') {
            reject({
                status: 'failed',
                error: 'PlayerToken country code is not available on this application_id',
            });
        } else {
            let data = qs.stringify({
                'message': message,
                'phone': phone,
                'sender': sender
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://portal-otp.smsmkt.com/api/send-message',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'api_key': result.api_key,
                    'secret_key': result.secret_key
                },
                data: data
            };


            try {
                const response = await axios.request(config);
                const apiResponse = response.data;
                if (apiResponse.code === '000' && apiResponse.detail === 'OK.') {
                    resolve(apiResponse);
                } else {
                    reject(apiResponse);
                }
            } catch (error) {
                reject({
                    status: 'failed',
                    error: error.message,
                    apiResponse: error.response ? error.response.data : null
                });
            }

        }

    });


}
module.exports = { SMSMKTSMSSender };
