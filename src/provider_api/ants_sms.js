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

async function AntsSMSSender(from, text, to, country_code) {


    const Authorization = await AntsAccount(country_code);
    const credentials = `${Authorization.username}:${Authorization.password}`;;
    const encodedCredentials = Buffer.from(credentials).toString('base64');



    return new Promise(async (resolve, reject) => {
        let data = JSON.stringify({
            "bulkId": "testEL-01/23/24-02",
            "messages": [
                {
                    "from": from,
                    "destinations": [
                        {
                            "to": to,
                            "messageId": "testdev02"
                        }
                    ],
                    "text": text,
                    "shorturl": "n",
                    "notifyUrl": process.env.ANTS_CALLBACK_URL,
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
        axios.request(config)
            .then((response) => {
                var name = response.data.details[0].status.name;
                //debug structure// console.log(response.data.details[0].status.description);
                if (name == "REJECTED") {
                    reject(JSON.stringify(response.data.details[0].status.description));
                } else {
                    resolve(JSON.stringify(response.data.details[0].status.description));
                }
            })
            .catch((error) => {
                //console.log(error.response.data.error);
                reject(error.response.data.error);
            });
    });
}

CallBackStatus = async (_req, _res) => {
    _res.json({ data: 'Callback Status!' });
};

module.exports = { AntsSMSSender, CallBackStatus };