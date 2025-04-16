const axios = require('axios');
const https = require('https');
const ControllerElasticEmail = require('.././Http/Controller/Provider/ControllerElasticEmail');
const _ControllerElasticEmail = new ControllerElasticEmail();
const ControllerAPI = require('../Http/Controller/ControllerAPI');
const _ControllerAPI = new ControllerAPI();

async function ElasticEmailSenderBulk(data, config_id, campaign_name, batchSize = 10) {
    const parsed_subject = data[0].email_subject;
    const parsed_fromName = data[0].fromName;
    const parsed_template = data[0].template_id;
    const parsed_from = data[0].from;
    const application_id = data[0].application_id;

    const res = await _ControllerElasticEmail.GetElasticEmailBulkAPI(application_id);
    const parsed_apikey = res.rows[0] ? res.rows[0].apikey : null;

    const validRecords = data.filter(item =>
        item.player_info &&
        typeof item.player_info === 'object' &&
        item.player_info.email);

    const uniqueEmails = [...new Set(validRecords.map(entry => entry.player_info.email))];
    console.log(`Processing ${uniqueEmails.length} unique emails in batches of ${batchSize}`);

    // Process in batches of maximum 100
    for (let i = 0; i < uniqueEmails.length; i += batchSize) {
        const batch = uniqueEmails.slice(i, i + batchSize);
        const batchEmails = batch.join(',');

        console.log(`Batch ${Math.floor(i / batchSize) + 1}: processing ${batch.length} emails`);
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?isTransactional=false&subject=${encodeURIComponent(parsed_subject)}&fromName=${encodeURIComponent(parsed_fromName)}&from=${encodeURIComponent(parsed_from)}&to=${encodeURIComponent(batchEmails)}&template=${encodeURIComponent(parsed_template)}&apikey=${parsed_apikey}&channel=${config_id}`,
            headers: {},
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 60000
        };


        try {
            const response = await axios.request(config);

            const batchData = validRecords.filter(entry => batch.includes(entry.player_info.email));
            if (response.data && response.data.success) {
                console.log(`Batch ${Math.floor(i / batchSize) + 1} sent successfully`);
                await StoreMessageHistory(batchData, config_id, campaign_name, response, 'success');
            } else {
                console.log(`Batch ${Math.floor(i / batchSize) + 1} failed: ${response.data.error || 'Unknown error'}`);
                await StoreMessageHistory(batchData, config_id, campaign_name, response, 'failed');
            }
        } catch (error) {
            console.error(`Error sending batch ${Math.floor(i / batchSize) + 1}:`, error.message);

            const batchData = validRecords.filter(entry => batch.includes(entry.player_info.email));

            const errorResponse = {
                data: {
                    success: false,
                    error: error.message || 'Unknown error'
                }
            };

            await StoreMessageHistory(batchData, config_id, campaign_name, errorResponse, 'failed');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update config status when complete
    await _ControllerAPI.GetUpdateConfigSent(config_id);
}

async function StoreMessageHistory(data, config_id, campaign_name, response, status) {
    const promises = data.map(async (player) => {
        await _ControllerAPI.GetStoreMessageHistory(
            config_id,
            campaign_name,
            player.player_info.user_in_game || player.player_token,
            player.player_info.email,
            'email',
            player.player_info.country || '',
            player.message_text || '',
            status,
            JSON.stringify(response.data || {}),
            player.from || '',
            player.email_subject || '',
            player.template_id || '',
            player.application_id || '',
            player.merge || '',
            player.player_info.brandcode || '',
            player.callback_url || ''
        );
    });

    await Promise.all(promises);
}

module.exports = { ElasticEmailSenderBulk };