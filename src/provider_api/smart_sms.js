const ControllerSmartSMS = require('.././Http/Controller/Provider/ControllerSmartSMS');
const _ControllerSmartSMS = new ControllerSmartSMS();
const axios = require('axios');

const PROVIDER_SMS_SMART = process.env.PROVIDER_SMS_SMART;
const ENVIRONMENT = process.env.ENVIRONMENT;
async function apiAccount(country_code) {

    const res = await _ControllerSmartSMS.GetSmartSMSAccount(PROVIDER_SMS_SMART, country_code, ENVIRONMENT);
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
                if (error.response.status === 402) {
                    const error = {
                        response: {
                            data: {
                                error: {
                                    message: "Invalid contact number"
                                }
                            }
                        }
                    };
                    reject(error);
                }
                reject(error);
            });
    });

}



module.exports = { SmartSMSSender };