const axios = require('axios');
const https = require('https');
const ControllerElasticEmail = require('.././Http/Controller/Provider/ControllerElasticEmail');
const _ControllerElasticEmail = new ControllerElasticEmail();
const ControllerAPI = require('../Http/Controller/ControllerAPI');
const _ControllerAPI = new ControllerAPI();

async function ElasticEmailSenderBulk(data, config_id, campaign_name, batchSize = 1) {
    const parsed_subject = data[0].email_subject;
    const parsed_fromName = data[0].fromName;
    const parsed_template = data[0].template_id;
    const parsed_from = data[0].from;

    // Get unique emails
    const uniqueEmails = [...new Set(data.map(entry => entry.player_info.email))];

    // Fetch API key
    const res = await _ControllerElasticEmail.GetElasticEmailBulkAPI(data[0].application_id);
    const parsed_apikey = res.rows[0] ? res.rows[0].apikey : null;

    // Send emails in batches
    for (let i = 0; i < uniqueEmails.length; i += batchSize) {
        const batch = uniqueEmails.slice(i, i + batchSize);
        const batchEmails = batch.join(',');
        console.log(batchEmails);

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?isTransactional=false&subject=${parsed_subject}&fromName=${parsed_fromName}&from=${parsed_from}&to=${batchEmails}&template=${parsed_template}&apikey=${parsed_apikey}&channel=${config_id}`,
            headers: {},
            httpsAgent: new https.Agent({ keepAlive: true }),
            timeout: 60000
        };

        try {
            const response = await axios.request(config);

            if (response.data.success) {
                console.log(`Batch ${i / batchSize + 1} sent successfully. Campaign: ${campaign_name}`);

                // Filter data for this batch
                const batchData = data.filter(entry => batch.includes(entry.player_info.email));

                await StoreMessageHistory(batchData, config_id, campaign_name, response, 'success');
            } else {
                console.log(`Batch ${i / batchSize + 1} sending failed. Campaign: ${campaign_name}`);

                const batchData = data.filter(entry => batch.includes(entry.player_info.email));

                const errorResponse = response.data.error.includes("Sorry, but the unexpected error occurred.")
                    ? {
                        data: {
                            success: false,
                            error: 'template_id does not exist for application_id',
                            errordata: ''
                        }
                    }
                    : response;

                await StoreMessageHistory(batchData, config_id, campaign_name, errorResponse, 'failed');
            }

            // Optional: Add a small delay between batches to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error sending batch ${i / batchSize + 1}:`, error);
        }
    }
}

async function StoreMessageHistory(data, config_id, campaign_name, response, status) {
    const promises = data.map(async (player) => {
        await _ControllerAPI.GetStoreMessageHistory(
            config_id,
            campaign_name,
            player.player_info.user_in_game,
            player.player_info.email,
            'email',
            player.player_info.country,
            player.message_text,
            status,
            JSON.stringify(response.data),
            player.from,
            player.email_subject,
            player.template_id,
            player.application_id,
            player.merge,
            player.player_info.brandcode,
            player.callback_url
        );
    });

    await Promise.all(promises);
}

module.exports = { ElasticEmailSenderBulk };