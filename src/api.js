
const { local_connection, joystick_connection, joystick_client } = require('../utils/db_connection');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { countReset } = require('console');
var axios = require('axios');

var pre_compile_data = [];
let counter = { fails: 0, success: 0 };

var interval = 500;

(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN cmw_listener');
    client.on('notification', function (data) {
        //console.log("data", JSON.parse(data.payload));
        setTimeout(() => {
            local_connection.query(`SELECT * FROM cmw_config where triggerstatus='active' and sending ='true' and status !='sending'`).then(res => {
                const data = res.rows;
                console.log('Config queue count : ', res.rowCount);

                data.forEach(row => {
                    fs.createReadStream('./uploads/data_leads/' + row.data_leads)
                        .pipe(csv())
                        .on('data', function (data) {
                            try {
                                pre_compile_data.push(JSON.stringify({ 'player_token': data.playertoken, 'country': data.country, 'message': data.message, 'platform': data.platform }));
                                //console_log(data.playertoken + ',' + data.country + ',' + data.message + ',' + data.platform);
                                //constructData(data.playertoken, data.country, data.message, data.platform);
                            } catch (err) {
                                console_log(err);
                                console_log('error contact number');
                            }
                        })
                        .on('end', () => {
                            //console_log('done');
                            //console.log(pre_compile_data);
                            constructData(pre_compile_data);
                        });
                })
            })
        }, "5000")
    });
})();
/*


    */

function constructData(pre_compile_data) {

    let total_instant = 0;
    let query_instant = 0;
    pre_compile_data.forEach(function (el, index) {
        total_instant++
        setTimeout(async function () {

            var obj = JSON.parse(el);
            //console.log(obj.player_token, obj.country, obj.message, obj.platform);
            //counter.success++;
            joystick_connection.query(`select pdr.email,pdr.phone_number from  afun_afun.player_data pd   
            left join afun_afun.player_data_revision pdr on pdr.playerid = pd.playerid 
            and pdr.dw_iscurrent = '1'
            where pd.playertoken ='${obj.player_token}'`, (err, res) => {
                const data = res.rows;
                if (err) {
                    console_log(`Error executing query: ${err.message}`);
                } else {
                    data.forEach(async row => {
                        if (obj.platform == 'sms') {
                            await sendSMS(obj.message, row.phone_number)
                                .then(function (response) {
                                    //console.log('success');
                                    console.log(`Status : ${obj.player_token} Sent`);
                                    counter.success++;
                                    query_instant++
                                })
                                .catch(function (error) {
                                    //console.log('error');
                                    console.log(`Status : ${obj.player_token} Failed`);
                                    counter.fails++;
                                    query_instant++
                                })
                                .finally(function () {
                                    if (pre_compile_data.length == query_instant) {
                                        console.log(`Campaign: test, Result: ${counter.success} sent, ${counter.fails} failed`);
                                        counter.success = 0;
                                        counter.fails = 0;
                                    }
                                });
                        }
                        else if (obj.platform == 'email') {
                            //sendEmail(player_token, country, message, platform, row.email);
                        }

                    });
                }
            });
        }, index * interval);


    });



}

async function sendSMS(player_token, country, message, platform, phone_number) {
    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://my.sms-smart.com/rest/send_sms?from=+639611573154&to=INV&message=${message}&username=9J3CtNdM&password=m4K1c25P`
        };

        await axios(config)
            .then(function (response) {
                resolve();
            })
            .catch(function (error) {
                reject();
            });
    });
}

async function sendEmail(player_token, country, message, platform, email) {
    await console_log(JSON.stringify({ 'player_token': player_token, 'country': country, 'message': message, 'platform': platform, 'email': email }));
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