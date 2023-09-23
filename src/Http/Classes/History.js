
const { local_connection, joystick_connection } = require('../../../utils/db_connection');

async function setMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, local_time, brand_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_history(config_id, campaign_name, player_token, player_contact, platform, country, message, status, created_at, updated_at, api_response, from_sender, email_subject, template_id, application_id, merge, brand_id) VALUES('${config_id}', '${campaign_name}', '${player_token}', '${player_contact}', '${platform}', '${country}', '${message}', '${status}', '${local_time}', '${local_time}', '${api_response}', '${from}', '${email_subject}', '${template_id}', '${application_id}', '${merge}', '${brand_id}')`, (err, res) => {
            err ? reject(`storeMessageHistory[Error]: ${err.message}`) : resolve(res);
        });
    });
}


module.exports = function () {
    this.setMessageHistory = setMessageHistory;
}