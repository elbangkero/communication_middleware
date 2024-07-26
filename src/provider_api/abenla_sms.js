const ControllerAbenla = require('.././Http/Controller/Provider/ControllerAbenla');
const _ControllerAbenla = new ControllerAbenla();
const axios = require('axios');

async function API_Abenla_Account_SMS(country_code, classificationcode) {
    const vip_classification = ['VVIP', 'VIP_DEAL', 'VIP4', 'VIP3', 'VIP2', 'VIP1', 'VIP0', 'VIP 1', 'VIP'];
    function findCommonElement(vip_classification, classificationcode) {
        for (let i = 0; i < vip_classification.length; i++) {
            for (let j = 0; j < classificationcode.length; j++) {
                if (vip_classification[i] === classificationcode[j]) {

                    return true;
                }
            }
        }
        return false;
    }


    const res = findCommonElement(vip_classification, classificationcode) ? await _ControllerAbenla.GetAbenlaAccount(country_code, 'VIP') : await _ControllerAbenla.GetAbenlaAccount(country_code, 'Regular');
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { "loginName": row.username, "sign": row.md5key, "endpoint": row.endpoint };
        })
    );

    if (results.length > 0) {
        return results[0];
    } else {
        return { "loginName": "", "sign": "", "endpoint": "" };
    }

}


async function AbenlaSMSSender(message, phone_number, country_code, classificationcode) {

    //API_Abenla_Account_SMS(country_code, classificationcode);
    const ServiceTypeId = 550;
    const callBack = false;
    const brandName = 'LongCode';
    return new Promise(async (resolve, reject) => {
        const result = await API_Abenla_Account_SMS(country_code, classificationcode);
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `${result.endpoint}?loginName=${result.loginName}&sign=${result.sign}&phoneNumber=${phone_number}&message=${message}&brandName=${brandName}&callBack=${callBack}&smsGuid=&serviceTypeId=${ServiceTypeId}`,
            headers: {}
        };

        try {
            axios.request(config)
                .then((response) => {
                    if (response.data.Code == '106')
                        resolve(response);
                    else {
                        reject(response);
                    }
                })
                .catch((error) => {
                    var ErrorMEssage = {
                        "data": {
                            "SmsPerMessage": 1, "Code": 110, "Message": "SendSmsFail"
                        }
                    };
                    reject(ErrorMEssage);

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



module.exports = { AbenlaSMSSender };