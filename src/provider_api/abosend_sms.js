const { local_connection } = require('../../utils/db_connection');
const axios = require('axios');
const qs = require('qs');
const md5 = require("md5");

async function checkOddEven() {

    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${process.env.PROVIDER_ABOSEND}' ORDER BY random() LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { 'md5Key': row.md5key, 'rand': row.rand, 'orgCode': row.orgcode };
        })
    );
    if (results.length > 0) {
        return results[0];
    }
}


async function abosendAPIParameters(country_code, phone_number, message, row_number) {

    const api_details = await checkOddEven(row_number);
    const data_encrytpion = `${api_details.orgCode}${message}${api_details.rand}${api_details.md5Key}`;
    const hash = md5(data_encrytpion).toUpperCase();

    if (country_code == 'IN') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+91',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'ID') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+62',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'JP') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+81',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'MY') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+60',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'TH') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+66',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'VN') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+84',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'PH') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+63',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;

    } else {
        let data = qs.stringify({
            'orgCode': '',
            'mobileArea': '',
            'rand': '',
            'content': '',
            'mobiles': '',
            'sign': ''
        });
        return data;
    }
}
async function AbosendSMSSender(message, from, phone_number, country_code, row_number) {
    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://smsapi.abosend.com:8205/api/sendSMS',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: await abosendAPIParameters(country_code, phone_number, message, row_number)
        };

        axios.request(config)
            .then((response) => {
                if (response.data.code == '200')
                    resolve(response)
                else
                    reject(response);
            })
            .catch((error) => {
                reject(error);
            });

    });

}



module.exports = { AbosendSMSSender };