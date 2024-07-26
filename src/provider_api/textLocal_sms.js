const ControllerTextLocalSMS = require('.././Http/Controller/Provider/ControllerTextLocal');
const _ControllerTextLocalSMS = new ControllerTextLocalSMS();
const axios = require('axios');

const PROVIDER_TEXT_LOCAL_SMS = process.env.PROVIDER_TEXT_LOCAL_SMS;


async function TextLocalAccount() {
    const res = await _ControllerTextLocalSMS.GetTextLocalAccount(PROVIDER_TEXT_LOCAL_SMS);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { "apikey": row.apikey };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { "apikey": "" };
    }
}

async function TextLocalSender(from, message, phone_number) {
    const encodedMessage = encodeURIComponent(message);
    const encodedFrom = encodeURIComponent(from);
    const encodedPhoneNumber = encodeURIComponent(phone_number);
    return new Promise(async (resolve, reject) => {
        const result = await TextLocalAccount();
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.txtlocal.com/send/?apiKey=${result.apikey}&numbers=${encodedPhoneNumber}&message=${encodedMessage}&sender=${encodedFrom}&unicode=true`,
            headers: {
                'Cookie': 'PHPSESSID=jtenbp0mn67tsfcor7g1l22mh6'
            }
        };

        try {
            axios.request(config)
                .then((response) => {
                    if (response.data.status == 'success')
                        resolve(response)
                    else
                        reject(response);
                })
                .catch((error) => {
                    reject(error);
                });
        } catch (err) {
            const errorResponse = {
                "data": {
                    success: false,
                    error: 'Error 520: Unknown Error',
                    errordata: 'ops! Something went wrong.'
                }
            };
            reject(errorResponse);
        }


    });


}



module.exports = { TextLocalSender };