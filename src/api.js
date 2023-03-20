const console_log = require('./log_file_path');
const { local_connection, joystick_connection } = require('../utils/db_connection');
const multer = require('multer');
/*
local_connection.query(`select * from cmw_config cc `, (err, res) => {
    if (err) {
        console_log(`Error executing query: ${err.message}`);
    } else {
        console.log(`Query result: ${JSON.stringify(res.rows)}`);
    }
});


joystick_connection.query(`select * from  afun_afun.player_data pd  limit 1`, (err, res) => {
    if (err) {
        console_log(`Error executing query: ${err.message}`);
    } else {
        console.log(`Query result: ${JSON.stringify(res.rows)}`);
    }
});
*/

const multerStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        if (file.fieldname === "data_leads") {
            cb(null, './uploads/data_leads');
        }
    },

    filename: (req, file, cb) => {
        if (file.fieldname === "data_leads") {
            cb(null, `${Date.now()}_${file.originalname}`)
        }
    }
});
const multerFilter = (req, file, cb) => {
    if (file.fieldname === "data_leads") {
        if (!file.originalname.match(/\.csv$|\.xlsx$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a CSV or xlsx file only'))
        }
        cb(null, true)
    }


};

upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});


insertConfig = async (_req, _res) => {

    let date_now = new Date().toISOString();
    const sending = _req.body.sending == 'on' ? true : false;
    const data_leads = _req.body.data_source == 'csv' ? _req.files.data_leads[0].filename : Buffer.from(_req.body.data_leads).toString('base64');
    local_connection.query(`INSERT INTO cmw_config(status,triggerstatus,cron_expression,created_at,updated_at,start_at,sending,data_source,campaign_name,data_leads) VALUES ('pending','active','${_req.body.cron_expression}','${date_now}','${date_now}','${date_now}','${sending}','${_req.body.data_source}','${_req.body.campaign_name}','${data_leads}')`, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] });
        }
    });

}

module.exports = function (app) {
 
    app.post('/upload/upload-config', upload.fields([
        {
            name: "data_leads",
            maxCount: 1,
        }
    ]), insertConfig);

};