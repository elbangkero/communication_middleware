const axios = require('axios');
const { local_connection } = require('../../utils/db_connection');

async function GoogleWebHook(success_rate_ratio) {
    CheckingSuccessRate(success_rate_ratio)
}


async function CheckingSuccessRate(rate) {
    let total = rate.success + rate.failed;
    const successRate = total > 0 ? (rate.success / total) * 100 : 0;
    if (successRate < 60) {
        const msg = await GetListofError(rate.config_id);
        const sentBy = await GetSentBy(rate.config_id);
        Sending(msg.rows, rate.config_id, sentBy.rows[0].created_by);
    }
    return false;
}

async function Sending(msg = [], config_id, created_by) {
    let errorMessageData = [];

    msg.forEach((item, index) => {
        const errorData = errorMessages(item.api_response);
        errorMessageData.push(errorData);
    });

    let messagePayload = '<b>Errors found:</b>\n';
    msg.forEach((item, index) => {
        messagePayload += `${index + 1}. ${errorMessages(item.api_response)} - Count : ${item.count}\n`;
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.ENVIRONMENT = 'development' ? 'https://chat.googleapis.com/v1/spaces/AAAAKo_jn1E/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=Zs5XPK8LO3bz9VGnNSp50NRNCqjdorRXiLVdKBH2rnQ' : process.env.ENVIRONMENT,
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        data: {
            "cards": [
                {
                    "header": {
                        "title": "Summary Report",
                        "subtitle": `Failed sendouts were found in the campaign`,
                    },
                    "sections": [
                        {
                            "widgets": [
                                {
                                    "keyValue": {
                                        "topLabel": "Config ID : ",
                                        "content": `${config_id}`
                                    }
                                },
                                {
                                    "keyValue": {
                                        "topLabel": "Sent on : ",
                                        "content": new Date(msg[0].created_at).toISOString().split('T')[0]
                                    }
                                },
                                {
                                    "keyValue": {
                                        "topLabel": "Sent by : ",
                                        "content": created_by
                                    }
                                }
                            ]
                        },
                        {
                            "widgets": [
                                {
                                    "textParagraph": {
                                        "text": messagePayload
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });

}

async function GetListofError(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select created_at::date,api_response,count(*) from cmw_history ch where status = 'failed' and config_id = '${config_id}' group by created_at::date,api_response order by created_at desc;`, (err, res) => {
            err ? reject(`GetListofError[Error]: ${err.message}`) : resolve(res);
        })
    });
}
async function GetSentBy(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select created_by  from cmw_config cc where cc.config_id = '${config_id}'; `, (err, res) => {
            err ? reject(`GetSentBy[Error]: ${err.message}`) : resolve(res);
        })
    });
}


function errorMessages(api_response) {
    const mappings = [
        { substring: '{"message":"Invalid Site ID"}', value: 'The site ID you entered is not valid. Please check and try again.' },
        { substring: '{"message":"Provider does not exist in sms platform"}', value: 'The application_id you selected is not available on sms platform. Please choose a different application_id.' },
        { substring: '{"success":false,"error":"APIKey Expired"}', value: 'The Elastic Email API key has expired. Please try again.' },
        { substring: '{"success":false,"error":"Error: Invalid FROM email address \\"\\""}', value: 'The playertoken email address formatted incorrectly' },
        { substring: '{"success":false,"error":"template_id does not exist for application_id","errordata":""}', value: 'The template_id does not exist for the provided application_id' },
        { substring: '{"message":"Provider does not exist in email platform"}', value: 'The application_id you selected is not available on email platform. Please choose a different application_id.' },
        { substring: 'Invalid {PlayerToken}', value: 'The playertoken is invalid' },
        { substring: '{"error":{"message":"Invalid contact number"}}', value: 'The playertoken phone number formatted incorrectly' },
        { substring: '"Invalid number - phone number formatted incorrectly"', value: 'The playertoken phone number formatted incorrectly' }
    ];
    try {
        for (const mapping of mappings) {
            if (api_response.includes(mapping.substring)) {
                return mapping.value;
            }
        }

        return api_response;
    } catch {
        return 'Error Bad Request';
    }
}


module.exports = { GoogleWebHook };
