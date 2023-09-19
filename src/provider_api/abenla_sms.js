const { local_connection } = require('../../utils/db_connection');
const axios = require('axios');

async function API_Abenla_Account_SMS(country_code, classificationcode) {
    const vip_classification = ['VVIP', 'VIP_DEAL', 'VIP4', 'VIP3', 'VIP2', 'VIP1', 'VIP0', 'VIP 1', 'VIP'];
    const ClassResult = vip_classification.includes(classificationcode);

    if (ClassResult) {
        const res = await local_connection.query(`SELECT username, md5key, endpoint FROM cmw_acct_providers cap
        left join cmw_providers cp on cp.provider_code = cap.provider_code 
        where cap.provider_code = '${process.env.PROVIDER_ABENLA_SMS}' and cap.country_code = '${country_code}' and rand = 'VIP' LIMIT 1`);
        var data = res.rows;

    } else {
        const res = await local_connection.query(`SELECT username, md5key, endpoint FROM cmw_acct_providers cap
        left join cmw_providers cp on cp.provider_code = cap.provider_code 
        where cap.provider_code = '${process.env.PROVIDER_ABENLA_SMS}' and cap.country_code = '${country_code}' and rand = 'Regular' LIMIT 1`);
        var data = res.rows;
    }

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

    });


}



module.exports = { AbenlaSMSSender };