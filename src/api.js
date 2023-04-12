
const { local_connection, joystick_connection, joystick_client } = require('../utils/db_connection');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { countReset } = require('console');
var axios = require('axios');


var interval = 1000;
let credentials = { "username": "", "password": "" };
//let counter = { fails: 0, success: 0 };
(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN cmw_listener');
    client.on('notification', function (data) {
        getConfig(parseInt(data.payload));
        //console.log("data", JSON.parse(data.payload));
        function getConfig(dataload) {
            setTimeout(() => {
                local_connection.query(`SELECT * FROM cmw_config where triggerstatus='active' and sending ='true' and status !='sending'`).then(res => {
                    const data = res.rows;
                    console_log(`Config queue count : ${res.rowCount}`);

                    console_log(`payload : ${dataload}`);
                    const callback = dataload == res.rowCount;
                    if (callback) {
                        data.forEach(row => {

                            var pre_compile_data = [];
                            var dynamic_contact = row.config_id;
                            pre_compile_data[dynamic_contact];
                            //console.log(dynamic_contact);
                            fs.createReadStream('./uploads/data_leads/' + row.data_leads)
                                .pipe(csv())
                                .on('data', function (data) {
                                    try {
                                        pre_compile_data.push(JSON.stringify({ 'player_token': data.playertoken, 'country': data.country, 'message_text': data.message_text, 'platform': data.platform, 'from': data.from, 'template_id': data.template_id, 'email_subject': data.email_subject, 'application_id': data.application_id }));
                                        //console_log(data.playertoken + ',' + data.country + ',' + data.text_message + ',' + data.platform);
                                        //constructData(data.playertoken, data.country, data.message, data.platform);
                                    } catch (err) {
                                        console_log(err);
                                        console_log('error contact number');
                                    }
                                })
                                .on('end', () => {
                                    //console_log('done');
                                    //console.log(pre_compile_data);

                                    constructData(row.config_id, pre_compile_data, row.campaign_name);
                                    local_connection.query(`update cmw_config set status= 'sending' where config_id=${row.config_id}`, (err, res) => {
                                        if (err) {
                                            console_log(`Error executing query: ${err.message}`);
                                        }
                                    });
                                });
                        })
                    }
                })
            }, "10000")
        }

    });
    //counter.success = 0;
    //counter.fails = 0;


})();


function constructData(config_id, pre_compile_data, campaign_name) {


    let dynamic_counter = {};
    let counter_name = 'counter';

    dynamic_counter[counter_name] = { fails: 0, success: 0 };
    //console.log(dynamic_counter.counter);



    let query_instant = 0;
    pre_compile_data.forEach(function (el, index) {
        setTimeout(async function () {

            var obj = JSON.parse(el);
            //console.log(obj.player_token, obj.country, obj.text_message, obj.platform);
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
                            await sendSMS(obj.message_text, obj.from, row.phone_number, obj.country)
                                .then(function (response) {
                                    //console.log('success');
                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                    //counter.success++;
                                    query_instant++
                                    dynamic_counter.counter.success++;
                                    //console.log(response.data);
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id);
                                })
                                .catch(function (error) {
                                    //console.log('error');
                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                    //counter.fails++;
                                    dynamic_counter.counter.fails++
                                    query_instant++
                                    //console.error(error.response.data);
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', JSON.stringify(error.response.data), obj.from, '', '', obj.application_id);
                                })
                                .finally(async function () {
                                    if (pre_compile_data.length == query_instant) {

                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                        dynamic_counter.counter.success = 0;
                                        dynamic_counter.counter.fails = 0;
                                        pre_compile_data.length = 0;

                                        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                            if (err) {
                                                console_log(`Error executing query: ${err.message}`);
                                            }
                                        });
                                    }
                                });
                        }
                        else if (obj.platform == 'email') {
                            await sendEmail(obj.from, row.email, obj.email_subject, obj.template_id)
                                .then(function (response) {
                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                    query_instant++
                                    dynamic_counter.counter.success++;
                                    // console.log(JSON.stringify(response.data));
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, obj.email_subject, obj.template_id, obj.application_id);
                                }).catch(function (error) {
                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                    dynamic_counter.counter.fails++
                                    query_instant++
                                    //console.log(error.data);
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'failed',JSON.stringify(error.data), obj.from, obj.email_subject, obj.template_id, obj.application_id);
                                }).finally(async function () {
                                    if (pre_compile_data.length == query_instant) {
                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                        dynamic_counter.counter.success = 0;
                                        dynamic_counter.counter.fails = 0;
                                        pre_compile_data.length = 0;

                                        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                            if (err) {
                                                console_log(`Error executing query: ${err.message}`);
                                            }
                                        });
                                    }
                                });
                        }
                    });
                }
            });
        }, index * interval);
    });
}

function apiAccount(country_code) {
    if (country_code == 'TH') {
        credentials.username = "N8Og84n1";
        credentials.password = "qyu5C1DA";
    } else if (country_code == 'VN') {
        credentials.username = "9J3CtNdM";
        credentials.password = "m4K1c25P";
    } else {
        credentials.username = "";
        credentials.password = "";
    }
}

async function storeMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id) {

    let date_now = new Date().toISOString();
    local_connection.query(`INSERT INTO cmw_history (config_id,campaign_name,player_token,player_contact,platform,country,message,status,created_at,updated_at,api_response,from_sender,email_subject,template_id,application_id) VALUES ('${config_id}','${campaign_name}','${player_token}','${player_contact}','${platform}','${country}','${message}','${status}','${date_now}','${date_now}','${api_response}','${from}','${email_subject}','${template_id}','${application_id}')`, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err}`);
        }
    });
}


async function sendSMS(message, from, phone_number, country_code) {

    apiAccount(country_code);
    const encodedParamValueMessage = encodeURIComponent(message);
    const encodedParamValueFrom = encodeURIComponent(from);
    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://my.sms-smart.com/rest/send_sms?from=${encodedParamValueFrom}&to=+639611573154&message=${encodedParamValueMessage}&username=${credentials.username}&password=${credentials.password}`
        };

        await axios(config)
            .then(function (response) {
                resolve(response);
                //console.log(response);
            })
            .catch(function (error) {
                //console.error(error.response.data);
                reject(error);
            });
    });

}

async function sendEmail(from, email, subject, template_id) {


    const apikey = '7C41D4746E1C491FAB5CC72DFF9EF3F117A02CD035AEACE30E9823CD3D0581D20B61291546D6AF53BEA633563CE388E8'
    const email_subect = encodeURIComponent(subject);

    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subect}&from=${from}&to=robert.gajelomo@everlounge.net&template=${template_id}&isTransactional=true&apikey=${apikey}`,
            headers: {}
        };


        axios(config)
            .then(function (response) {
                if (response.data.success)
                    resolve(response)
                else
                    reject(response);
            })
            .catch(function (error) {
                reject(error);
            });

    });

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



API_DisplayTriggers = async (_req, _res) => {

    local_connection.query(`select * from cmw_config order by config_id desc  `, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err.message}`);
            setTimeout(joystick_client, 60000);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json(res.rows);
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

    app.get('/api_triggers', API_DisplayTriggers);

};