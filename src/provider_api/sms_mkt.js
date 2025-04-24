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

async function SMSMKTSMSSender(_final_sender, message, phone, country_code, config_id) {

    const result = await API_Account(PROVIDER_SMS_MKT, country_code);

    return new Promise(async (resolve, reject) => {

        if (result.api_key === '') {
            reject({
                status: 'failed',
                error: 'PlayerToken country code is not available on this application_id',
            });
        } else if (_final_sender !== 'HappyV') {
            reject({
                status: 'failed',
                error: 'SMS MKT is only available on HappyVegas',
            });
        } else if (country_code !== 'TH') {
            reject({
                status: 'failed',
                error: 'SMS MKT is only available on Thailand',
            });
        } else {
            let data = qs.stringify({
                "message": message,
                "sender": _final_sender,
                "phone": phone,
                "campaign_name": config_id
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
