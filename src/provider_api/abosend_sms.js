const ControllerAbosend = require('.././Http/Controller/Provider/ControllerAbosend');
const _ControllerAbosend = new ControllerAbosend();
const axios = require('axios');
const qs = require('qs');
const md5 = require("md5");

const PROVIDER_ABOSEND = process.env.PROVIDER_ABOSEND;
async function checkOddEven() {


    const res = await _ControllerAbosend.GetAbosendAccount(PROVIDER_ABOSEND);
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

function validateAndExtractAreaCode(phoneNumber) {
    // Define a regular expression for a common phone number format
    const phoneRegex = /^\+?(\d{1,2})?[\s.-]?(\(\d{1,4}\)|\d{1,4})([\s.-]?)\d{1,10}$/;

    // Test the phone number against the regular expression
    const match = phoneNumber.match(phoneRegex);

    if (match) {
        // Extract the area code
        const areaCode = match[1];

        return {
            isValid: true,
            areaCode: areaCode ? `+${areaCode}` : null,
            FinalPhoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
        };
    } else {
        // If the phone number is not valid, return the original phone number with a plus sign
        return {
            isValid: false,
            areaCode: null,
            FinalPhoneNumber: `+${phoneNumber}`,
        };
    }
}

async function abosendAPIParameters(country_code, phone_number, message, row_number) {

    const api_details = await checkOddEven(row_number);
    const data_encrytpion = `${api_details.orgCode}${message}${api_details.rand}${api_details.md5Key}`;
    const hash = md5(data_encrytpion).toUpperCase();
    const validated = validateAndExtractAreaCode(phone_number);
 
    if (validated) {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': validated.areaCode,
            'rand': api_details.rand,
            'content': message,
            'mobiles': validated.FinalPhoneNumber,
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