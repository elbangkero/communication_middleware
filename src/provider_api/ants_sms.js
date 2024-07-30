const ControllerAnts = require('.././Http/Controller/Provider/ControllerAnts');
const _ControllerAnts = new ControllerAnts();
const axios = require('axios');



const PROVIDER_ANTS_SMS = process.env.PROVIDER_ANTS_SMS;
async function AntsAccount(country_code) {

    const res = await _ControllerAnts.GetAntsAccount(PROVIDER_ANTS_SMS, country_code);


    const data = res.rows;


    const results = await Promise.all(
        data.map(async row => {
            return { "username": row.username, "password": row.password };
        })
    );

    if (results.length > 0) {
        return results[0];
    } else {
        return { "username": '', "password": '' };
    }

}

function extractBulkId(url) {
    const questionMarkIndex = url.indexOf('?');
    if (questionMarkIndex !== -1) {
        const queryString = url.slice(questionMarkIndex + 1);

        const queryParams = queryString.split('&');

        for (let i = 0; i < queryParams.length; i++) {
            const param = queryParams[i].split('=');
            if (param[0] === 'bulkId') {
                return param[1];
            }
        }
    }
    return null;
}

async function fromSender(brandcode) {
    if (brandcode === 'LIVECASINOHOUSE_COM') {
        return 'LCH-TH';
    } else if (brandcode === 'HAPPYLUKE_COM') {
        return 'HL-TH';
    } else if (brandcode === 'HAPPYVEGAS_COM') {
        return 'HV-TH';
    } else {
        return 'Income88th';
    }
}

async function AntsSMSSender(brandcode, text, to, country_code, _callback) {
    const from = await fromSender(brandcode);
    const Authorization = await AntsAccount(country_code);
    const credentials = `${Authorization.username}:${Authorization.password}`;;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    const bulkId = extractBulkId(_callback);


    return new Promise(async (resolve, reject) => {

        if (country_code != 'TH') {
            reject({ "message": "ANTS_SMS is only available on TH country" });
        }

        let data = JSON.stringify({
            "bulkId": `${bulkId}`,
            "messages": [
                {
                    "from": from,
                    "destinations": [
                        {
                            "to": `${to}`,
                            "messageId": `${bulkId}`
                        }
                    ],
                    "text": `${text}`,
                    "shorturl": "n",
                    "notifyUrl": `${_callback}`,
                    "notifyContentType": "application/json",
                    "callbackData": "ANTS Data"
                }
            ]
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api-service.ants.co.th/sms/send',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encodedCredentials}`
            },
            data: data
        };
        try {
            axios.request(config)
                .then((response) => {
                    var name = response.data.details[0].status.name;
                    //debug structure// console.log(response.data.details[0].status.description);
                    if (name == "REJECTED") {
                        reject(response.data.details[0].status.description);
                    } resolve(response.data.details[0].status.description);
                })
                .catch((error) => {
                    //console.log(error.response.data.error);
                    reject(error.response.data.error);
                });
        } catch (err) {
            const errorResponse = {
                data: {
                    success: false,
                    error: 'Error 520: Unknown Error',
                    errordata: 'ops! Something went wrong.'
                }
            };
            reject(errorResponse);
        }

    });
}


module.exports = { AntsSMSSender };