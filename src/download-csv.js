const { local_connection } = require('../utils/db_connection');
const fs = require('fs');
const iconv = require('iconv-lite');

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

        const fileBuffer = fs.readFileSync(`./uploads/data_leads/${cmw_config.rows[0].data_leads}`);

        const encoding = detectEncoding(fileBuffer);

        const utf8String = iconv.decode(fileBuffer, encoding);

        const csvRows = utf8String.split('\n');
        const headers = csvRows[0].split(',').map(header => header.trim());

        for (let i = 1; i < csvRows.length; i++) {
            const values = csvRows[i].split(',').map(value => value.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                results.push(row);
            }
        }

        const csvData = generateCsvData(results);

        _res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        _res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(cmw_config.rows[0].campaign_name)}.csv`);
        _res.send(Buffer.from('\uFEFF' + csvData, 'utf8'));
    } else {
        console.log(JSON.stringify({ 'statusCode': 404, 'status': 'failed', message: 'File does not exist', 'data': [] }));
        _res.status(200).json({ 'statusCode': 404, 'status': 'failed', message: 'File does not exist', 'data': [] });
    }
}

function detectEncoding(buffer) {
    const encodings = ['utf-8', 'utf-16le', 'utf-16be', 'iso-8859-1', 'windows-1252', 'shift_jis', 'euc-jp'];
    for (const encoding of encodings) {
        try {
            iconv.decode(buffer, encoding);
            return encoding;
        } catch (error) {

        }
    }
    return 'utf-8';
}

const generateCsvData = (csv_data) => {
    if (!Array.isArray(csv_data) || csv_data.length === 0) {
        throw new Error('Invalid input data. Expected an array of objects.');
    }

    const headers = Object.keys(csv_data[0]);
    const data = [headers];

    csv_data.forEach(item => {
        const row = headers.map(header => {
            const cell = item[header] || '';
            return cell.toString().replace(/"/g, '""');
        });
        data.push(row);
    });

    return data.map(row => `"${row.join('","')}"`).join('\n');
};

module.exports = function (app) {
    app.get('/download-csv/', downloadCSV);
};