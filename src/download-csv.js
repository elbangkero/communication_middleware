const { local_connection } = require('../utils/db_connection');

const fs = require('fs');
const csv = require('csv-parser');


downloadCSV = async (_req, _res) => {

    const cmw_config = await getConfigID(_req.query.id);

    async function getConfigID(config_id) {
        return new Promise(async (resolve, reject) => {
            local_connection.query(`select campaign_name,data_leads from cmw_config cc where config_id = '${config_id}';`, (err, res) => {
                err ? reject(`getConfigID[Error]: ${err.message}`) : resolve(res);
            });
        });
    }
    const results = [];

    if (fs.existsSync(`./uploads/data_leads/${cmw_config.rows[0].data_leads}`)) {
        fs.createReadStream(`./uploads/data_leads/${cmw_config.rows[0].data_leads}`)
            .pipe(csv())
            .on('data', (data) =>
                results.push(data),
            )
            .on('end', () => {

                // Function to clean the keys
                function cleanKey(key) {
                    return key.replace(/[^\x20-\x7E]/g, ''); // Replace non-ASCII characters
                }

                // Iterate over each element in the results array
                const cleanedResults = results.map(user => {
                    const cleanedUser = {};
                    const cleanedKeys = Object.keys(user).map(cleanKey);

                    cleanedKeys.forEach((cleanedKey, index) => {
                        const originalKey = Object.keys(user)[index];
                        cleanedUser[cleanedKey] = user[originalKey];
                    });

                    return cleanedUser;
                });


                exportCSV(cleanedResults);
            });
    } else {
        console_log(JSON.stringify({ 'statusCode': 404, 'status': 'failed', message: 'File does not exist', 'data': [] }));
        _res.status(200).json({ 'statusCode': 404, 'status': 'failed', message: 'File does not exist', 'data': [] });
        return;
    }





    function exportCSV(data) {
        const campaign_name = cmw_config.rows[0].campaign_name;
        const htmlTable = `
    <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Export CSV</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  </head>
  <body>
      <table id="data-table" style="display:none">
          <tr>
              <th>playertoken</th>
              <th>message_text</th>
              <th>platform</th>
              <th>from</th>
              <th>template_id</th>
              <th>email_subject</th>
              <th>fromName</th>
              <th>application_id</th>
              <th>merge</th>
          </tr>
          ${data.map(r => `
          <tr>
              <td>${r.playertoken}</td>
              <td>${r.message_text}</td>
              <td>${r.platform}</td>
              <td>${r.from}</td>
              <td>${r.template_id}</td>
              <td>${r.email_subject}</td>
              <td>${r.fromName}</td>
              <td>${r.application_id}</td>
              <td>${r.merge}</td>
          </tr>
          `).join('')}
      </table>
      <script>
      function exportToCSV() {
          const table = document.getElementById('data-table');
          const wb = XLSX.utils.table_to_book(table, { sheet: "${campaign_name}" });
          XLSX.writeFile(wb, '${campaign_name}.csv');
          window.close(); // Close the current window/tab after export
      }
  
      // Call the exportToCSV function when the window is loaded
      window.onload = function() {
          exportToCSV();
      };
      </script>
  </body>
  </html>
    `;

        _res.send(htmlTable);
    }



}


module.exports = function (app) {
    app.get('/download-csv/', downloadCSV);
};