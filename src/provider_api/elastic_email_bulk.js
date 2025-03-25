const axios = require('axios');
const https = require('https');
const ControllerElasticEmail = require('.././Http/Controller/Provider/ControllerElasticEmail');
const _ControllerElasticEmail = new ControllerElasticEmail();
const ControllerAPI = require('../Http/Controller/ControllerAPI');
const _ControllerAPI = new ControllerAPI();


async function ElasticEmailSenderBulk(data, config_id, campaign_name) {
    const parsed_subject = data[0].email_subject;
    const parsed_fromName = data[0].fromName;
    const parsed_template = data[0].template_id;
    const parsed_from = data[0].from;

    const emails = [...new Set(data.map(entry => entry.player_info.email))].join(',');

    res = await _ControllerElasticEmail.GetElasticEmailBulkAPI(data[0].application_id);
    const parsed_apikey = res.rows[0] ? res.rows[0].apikey : null;


    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://api.elasticemail.com/v2/email/send?isTransactional=false&subject=${parsed_subject}&fromName=${parsed_fromName}&from=${parsed_from}&to=${emails}&template=${parsed_template}&apikey=${parsed_apikey}&channel=${config_id}`,
        headers: {},
        httpsAgent: new https.Agent({ keepAlive: true }),
        timeout: 60000
    };

    axios.request(config)
        .then(async (response) => {
            if (response.data.success) {
                console_log(`Result: Bulk sending sent. Campaign name : ${campaign_name}`);
                await StoreMessageHistory(data, config_id, campaign_name, response, 'success');
            } else if (response.data.error.includes("Sorry, but the unexpected error occurred.") && !response.data.success) {
                const errorResponse = {
                    data: {
                        success: false,
                        error: 'template_id does not exist for application_id',
                        errordata: ''
                    }
                };
                console_log(`Result: Bulk sending failed. Campaign name : ${campaign_name}`);
                await StoreMessageHistory(data, config_id, campaign_name, errorResponse, 'failed');
            } else {
                console_log(`Result: Bulk sending failed. Campaign name : ${campaign_name}`);
                await StoreMessageHistory(data, config_id, campaign_name, response, 'failed');
            }
        })
        .catch((error) => {
            console.log(error);
        });


}

async function StoreMessageHistory(data, config_id, campaign_name, response, status) {
    data.forEach(async (player) => {
        await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, player.player_info.user_in_game, player.player_info.email, 'email', player.player_info.country, player.message_text, status, JSON.stringify(response.data), player.from, player.email_subject, player.template_id, player.application_id, player.merge, player.player_info.brandcode, player.callback_url);
    });

}

module.exports = { ElasticEmailSenderBulk };