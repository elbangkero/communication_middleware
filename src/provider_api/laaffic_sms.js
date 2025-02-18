const ControllerSMSLaaffic = require('.././Http/Controller/Provider/ControllerLaaffic');
const _ControllerSMSLaaffic = new ControllerSMSLaaffic();
const axios = require('axios');
const crypto = require("crypto");



const PROVIDER_SMS_LAAFFIC = process.env.PROVIDER_SMS_LAAFFIC;

async function API_Account(PROVIDER_SMS_LAAFFIC, country_code) {

    const res = await _ControllerSMSLaaffic.GetLaafficAccount(PROVIDER_SMS_LAAFFIC, country_code);
    const data = res.rows;
    const results = await Promise.all(
        data.map(async row => {
            return { "api_key": row.apikey, "secret_key": row.md5key, "endpoint": row.endpoint, "app_id": row.rand };
        })
    );

    if (results.length > 0) {
        return results[0];
    } else {
        return { "api_key": "", "secret_key": "", "endpoint": "", "app_id": "" };
    }

}


async function fromSender(brandcode) {
    if (brandcode === 'LCH') {
        return 'LCH-VN';
    } else if (brandcode === 'HL') {
        return 'HL-VN';
    } else {
        return 'Communication Middleware';
    }
}


async function SMSLaafficSender(sender, message, phone, country_code, brandcode, _final_sender) {
    const timestamp = Math.floor(Date.now() / 1000);
    const result = await API_Account(PROVIDER_SMS_LAAFFIC, country_code);

    const input = `${result.api_key}${result.secret_key}${timestamp}`;

    const sign = crypto.createHash("md5").update(input, "utf8").digest("hex");
    const from = await fromSender(brandcode);


    return new Promise(async (resolve, reject) => {

        if (country_code != 'VN') {
            reject({ "message": "Laaffic is only available on VN country" });
        }


        let data = JSON.stringify({
            "appId": result.app_id,
            "numbers": phone,
            "content": message,
            "senderId": _final_sender,
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: result.endpoint,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Api-Key': result.api_key,
                'Sign': sign,
                'Timestamp': timestamp
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                if (response.data.status != '0') {
                    reject(response.data);
                }
                resolve(response.data);
            })
            .catch((error) => {
                const errorMessage = {
                    response: {
                        data: {
                            status: 'failed',
                            error: 'Error 500: Unknown Error',
                            errordata: 'ops! Something went wrong.'
                        }
                    }
                };
                reject(errorMessage);
            });


    });

}
module.exports = { SMSLaafficSender };
