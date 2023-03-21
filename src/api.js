
const { local_connection, joystick_connection, joystick_client } = require('../utils/db_connection');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

var contacts = [];

 

(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN cmw_listener');
    client.on('notification', function (data) {
        console_log("data", JSON.parse(data.payload));
        console_log('notif from database!');
        console_log('resending...');

    });
})();
/*

fs.createReadStream('./uploads/data_leads/1679311625043_1675319514607_malaysia_leads.csv')
    .pipe(csv())
    .on('data', function (data) {
        try {
            contacts.push(data.playertoken);
            //console_log(data.playertoken + ',' + data.country + ',' + data.message + ',' + data.platform);
            constructData(data.playertoken, data.country, data.message, data.platform);
        } catch (err) {
            console_log(err);
            console_log('error contact number');
        }
    })
    .on('end', () => {
        //console_log('done');
    });
    */

function constructData(player_token, country, message, platform) {
    joystick_connection.query(`select pdr.email,pdr.phone_number from  afun_afun.player_data pd   
    left join afun_afun.player_data_revision pdr on pdr.playerid = pd.playerid 
    and pdr.dw_iscurrent = '1'
    where pd.playertoken ='${player_token}'`, (err, res) => {
        const data = res.rows;
        if (err) {
            console_log(`Error executing query: ${err.message}`);
        } else {
            data.forEach(row => {
                if (platform == 'sms')
                    sendSMS(player_token, country, message, platform, row.phone_number);
                /*.then(() => {
                    console.log('success');
                });*/
                else if (platform == 'email')
                    sendEmail(player_token, country, message, platform, row.email);
            })
        }
    });
}

function sendSMS(player_token, country, message, platform, phone_number) {
    console_log(JSON.stringify({ 'player_token': player_token, 'country': country, 'message': message, 'platform': platform, 'phone_number': phone_number }));
    /*
        return new Promise((resolve, reject) => {
      console.log(test)
      resolve();
    });
    */
}
function sendEmail(player_token, country, message, platform, email) {
    console_log(JSON.stringify({ 'player_token': player_token, 'country': country, 'message': message, 'platform': platform, 'email': email }));
}

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

searchJoystck = async (_req, _res) => {

    joystick_connection.query(`select * from  afun_afun.player_data pd  limit 1`, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err.message}`);
            setTimeout(joystick_client, 60000);
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

    app.get('/search_joystick', searchJoystck);

};