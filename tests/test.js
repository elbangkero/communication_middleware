const { BigQuery } = require('@google-cloud/bigquery');

// Specify the path to your service account key file
const keyFilename = '../service-account-key.json';

// Initialize BigQuery client
const bigquery = new BigQuery({ keyFilename, projectId: 'afun-dwh' });

async function queryBigQuery(array_tokens) {
  try {
    const query = `
      SELECsT email, phone, current_level, brand, country, 
             CONCAT(first_name, ' ', last_name) AS playername 
      FROM nexus.player_data 
      WHERE user_in_game in [${array_tokens}]
    `;

    const [rows] = await bigquery.query(query);

    if (rows.length === 0) {
      console.log('No results found for the query.');
    } else {
      console.log('Query Results:');
      return({
        'email': rows[0][0].email,
        'phone_number': rows[0][0].phone,
        'classificationcode': rows[0][0].current_level,
        'brandcode': rows[0][0].brand,
        'country': rows[0][0].country,
        'playername': rows[0][0].playername,
      });
    }
  } catch (error) {
    console.error('Error executing BigQuery query:', error.message);

    // Optional: Add more specific error handling
    if (error.code === 404) {
      console.error('The dataset or table does not exist.');
    } else if (error.code === 403) {
      console.error('Insufficient permissions to execute the query.');
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }

}






const array_tokens = ['
  {
    "player_token": "s2atowuo579703", "message_text": "", "platform": "email", "from": "no-reply@happyluke.com", "template_id": "HL NEW VERSION OCT 21", "email_subject": "PHIÊN BẢN HAPPYLUKE MỚI NHẤT SẼ ĐƯỢC RA MẮT VÀO 22/10/2024", "fromName": "HL", "application_id": "EMAIL_EE_DOM", "merge”:””}’
  '];

const playerTokens = array_tokens.map(data => {
      const parsed = JSON.parse(data); // Parse each string into an object
      return parsed.player_token; // Extract player_token
    });



   const test = await queryBigQuery(playerTokens);
   console.log(test);
