const { local_connection } = require('../../../utils/db_connection');

async function setMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, local_time, brand_id, callback_url) {
    return new Promise(async (resolve, reject) => {
        const query = `INSERT INTO cmw_history(config_id, campaign_name, player_token, player_contact, platform, country, message, status, created_at, updated_at, api_response, from_sender, email_subject, template_id, application_id, merge, brand_id, callback_url)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)  RETURNING history_id,status;`;

        const values = [config_id, campaign_name, player_token, player_contact, platform, country, message, status, local_time, local_time, api_response, from, email_subject, template_id, application_id, merge, brand_id, callback_url];

        local_connection.query(query, values, (err, res) => {
            if (err) {
                console.log(err);
                reject(`setMessageHistory[Error]: ${err.message}`);
            } else {
                resolve(res);
            }
        });
    });
}

module.exports = function () {
    this.setMessageHistory = setMessageHistory;
};
