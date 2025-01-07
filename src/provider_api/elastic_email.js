const ControllerElasticEmail = require('.././Http/Controller/Provider/ControllerElasticEmail');
const _ControllerElasticEmail = new ControllerElasticEmail();
const axios = require('axios');
const https = require('https');

const PROVIDER_ELASTIC_EMAIL = process.env.PROVIDER_ELASTIC_EMAIL;
async function ElasticEmailAccount(country_code, provider_code) {
    let res;
    if (PROVIDER_ELASTIC_EMAIL == provider_code) {
        res = await _ControllerElasticEmail.GetElasticEmailAccountSegregation(provider_code, country_code);
    } else {
        res = await _ControllerElasticEmail.GetElasticEmailAccount(provider_code);
    }

    const data = res.rows;
    const results = await Promise.all(
        data.map(async row => {
            return { 'apikey': row.apikey };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { 'apikey': '' };
    }

}

async function ElasticEmailSender(from, email, subject, template_id, fromName, country_code, merge, provider_code, retries = 5) {
    const apikey = await ElasticEmailAccount(country_code, provider_code);

    const email_subject = subject ? encodeURIComponent(subject) : encodeURIComponent('(no subject)');
    const encodedfromName = encodeURIComponent(fromName);

    const merge_params = new URLSearchParams(merge);

    let merge_type = "";
    merge_params.forEach((value, key) => {
        merge_type += `&merge_${key}=${value}`;
    });

    return new Promise(async (resolve, reject) => {

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subject}&fromName=${encodedfromName}&from=${from}&to=${email}&template=${template_id}&isTransactional=true&apikey=${apikey.apikey}&${merge_type}`,
            headers: {},
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 60000
        };

        const sendEmail = async (attempt) => {
            try {
                const response = await axios(config);
                if (response.data.success) {
                    resolve(response);
                } else if (response.data.error.includes("Sorry, but the unexpected error occurred.") && !response.data.success) {
                    const errorResponse = {
                        data: {
                            success: false,
                            error: 'template_id does not exist for application_id',
                            errordata: ''
                        }
                    };
                    reject(errorResponse);
                } else {
                    reject(response);
                }
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    if (attempt < retries) {
                        setTimeout(async function () {
                            console_log(`Retrying... Attempt ${attempt + 1}`);
                            await sendEmail(attempt + 1);
                        }, attempt * 10000);
                    } else {
                        const errorResponse = {
                            data: {
                                success: false,
                                error: 'Exceeded 1 min Request Timeout',
                                errordata: `${retries} attempts for this request have been exhausted`
                            }
                        };
                        reject(errorResponse);
                    }
                } else if (error.code === 'ERR_BAD_RESPONSE') {
                    if (attempt < retries) {
                        setTimeout(async function () {
                            console_log(`Retrying... Attempt ${attempt + 1}`);
                            await sendEmail(attempt + 1);
                        }, attempt * 10000);
                    } else {
                        const errorResponse = {
                            data: {
                                success: false,
                                error: 'Elastic Email API Service Not Available',
                                errordata: `${retries} attempts for this request have been exhausted`
                            }
                        };
                        reject(errorResponse);
                    }
                } else {
                    const errorResponse = {
                        data: {
                            success: false,
                            error: error,
                            errordata: ''
                        }
                    };
                    reject(errorResponse);
                }
            }
        };

        await sendEmail(0);
    });
}

module.exports = { ElasticEmailSender };