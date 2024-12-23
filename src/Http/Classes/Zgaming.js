const { BigQuery } = require('@google-cloud/bigquery');
const { local_connection } = require('../../../utils/db_connection');
const keyFilename = './service-account-key.json';

// Initialize BigQuery client
const bigquery = new BigQuery({ keyFilename, projectId: 'afun-dwh' });

async function SetZgamingUserInfo(array_tokens, config_id) {

    try {
        const sanitizedArray = sanitizeArray(array_tokens);
        const tokensList = sanitizedArray.map(token => `'${token}'`).join(', ');

        const query = `
          SELECT user_in_game, email, phone AS phone_number, current_level AS classificationcode, 
                 brand AS brandcode, country, 
                 CONCAT(first_name, ' ', last_name) AS playername 
          FROM nexus.player_data 
          WHERE user_in_game IN (${tokensList})
        `;


        const [rows] = await bigquery.query(query);

        // Update phone_number only for the specified user_in_game
        const updatedRows = rows.map(row => ({
            ...row,
            phone_number: row.user_in_game === '7a7f4dfdf38f85a6' //RHOY ACCT
            ? '639611573154' 
            : row.user_in_game === '1e21e8d1e4031454' //RIO ACCOUNT
            ? '+817074632626' 
            : row.phone_number,
        })); 
        if (updatedRows.length === 0) {
            return [];
        }

        return updatedRows;  
    } catch (error) {
        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'error' ,  updated_at = CURRENT_TIMESTAMP  where config_id=${config_id}`);
        return [];
    }
}

function sanitizeArray(inputArray) {
    return inputArray
        .map((item) => {
            // Ensure the item is a string
            if (typeof item !== 'string') {
                return null;
            }

            // Trim whitespace
            const trimmedItem = item.trim();

            // Escape single quotes
            const sanitizedItem = trimmedItem.replace(/'/g, "''");

            // Optionally validate length or allowed characters
            const isValid = /^[a-zA-Z0-9_-]+$/.test(sanitizedItem); // Example: Only alphanumerics, underscores, and dashes
            return isValid ? sanitizedItem : null;
        })
        .filter(Boolean); // Remove null or invalid entries
}


module.exports = function () {
    this.SetZgamingUserInfo = SetZgamingUserInfo;
}
