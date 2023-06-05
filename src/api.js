
const { local_connection, joystick_connection, joystick_client } = require('../utils/db_connection');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
var axios = require('axios');
const cron = require('node-cron');
const schedule = require('node-schedule');
const qs = require('qs');
const md5 = require("md5");

var interval = 3000;
let credentials = { "username": "", "password": "" };

const environment = `${process.env.ENVIRONMENT}`;
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
                                        pre_compile_data.push(JSON.stringify({ 'player_token': data.playertoken, 'country': data.country, 'message_text': data.message_text, 'platform': data.platform, 'from': data.from, 'template_id': data.template_id, 'email_subject': data.email_subject, 'fromName': data.fromName, 'application_id': data.application_id }));
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

                                    //constructData(row.config_id, pre_compile_data, row.campaign_name);


                                    if (row.is_scheduled == true) {
                                        const job = schedule.scheduleJob(row.start_at, async function () {
                                            constructData(row.config_id, pre_compile_data, row.campaign_name);
                                        });
                                    } else {
                                        constructData(row.config_id, pre_compile_data, row.campaign_name);
                                    }


                                    local_connection.query(`update cmw_config set status= 'sending' where config_id=${row.config_id}`, (err, res) => {
                                        if (err) {
                                            console_log(`Status_Update[Error]: ${err.message}`);
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
            var row_number = index;
            //console.log(obj.player_token, obj.country, obj.text_message, obj.platform);
            //counter.success++;
            joystick_connection.query(`select pdr.email,pdr.phone_number from  afun_afun.player_data pd   
            left join afun_afun.player_data_revision pdr on pdr.playerid = pd.playerid 
            and pdr.dw_iscurrent = '1'
            where pd.playertoken ='${obj.player_token}'`, (err, res) => {
                const data = res.rows;
                if (err) {
                    console_log(`getUserData[Error]: ${err.message}`);
                } else {
                    data.forEach(async row => {
                        if (obj.platform == 'sms') {

                            local_connection.query(`SELECT * FROM cmw_providers where application_id = '${obj.application_id}'`).then(res => {
                                const data = res.rows;
                                data.forEach(async row_provider => {

                                    if (row_provider.provider_code == 'SMS11') {

                                        await sendSmartSMS(obj.message_text, obj.from, row.phone_number, obj.country)
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
                                                            console_log(`DoneSMSSmartSending[Error]: ${err.message}`);
                                                        }
                                                    });
                                                }
                                            });
                                    } else if (row_provider.provider_code == 'SMS12') {
                                        await sendAbosendSMS(obj.message_text, obj.from, row.phone_number, obj.country, row_number)
                                            .then(function (response) {
                                                console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                query_instant++
                                                dynamic_counter.counter.success++;
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id);
                                            })
                                            .catch(function (error) {
                                                console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                dynamic_counter.counter.fails++
                                                query_instant++
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, '', '', obj.application_id);
                                            })
                                            .finally(async function () {
                                                if (pre_compile_data.length == query_instant) {
                                                    console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                    dynamic_counter.counter.success = 0;
                                                    dynamic_counter.counter.fails = 0;
                                                    pre_compile_data.length = 0;
                                                    local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                                        if (err) {
                                                            console_log(`DoneAbosending[Error]: ${err.message}`);
                                                        }
                                                    });
                                                }
                                            });
                                    }
                                    //provider checker if existing
                                    else {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                        storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', '{"message":"Application ID is not an SMS Provider"}', obj.from, '', '', obj.application_id);
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                                if (err) {
                                                    console_log(`DoneAbosending[Error]: ${err.message}`);
                                                }
                                            });
                                        }

                                    }
                                });
                                //provider checker if existing
                                if (data.length === 0) {

                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                    dynamic_counter.counter.fails++
                                    query_instant++
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', '{"message":"Provider is not existing"}', obj.from, '', '', obj.application_id);
                                    if (pre_compile_data.length == query_instant) {
                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                        dynamic_counter.counter.success = 0;
                                        dynamic_counter.counter.fails = 0;
                                        pre_compile_data.length = 0;
                                        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                            if (err) {
                                                console_log(`DoneAbosending[Error]: ${err.message}`);
                                            }
                                        });
                                    }
                                }
                            })



                        }

                        else if (obj.platform == 'email') {
                            await sendEmail(obj.from, row.email, obj.email_subject, obj.template_id, obj.fromName)
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
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, obj.email_subject, obj.template_id, obj.application_id);
                                }).finally(async function () {
                                    if (pre_compile_data.length == query_instant) {
                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                        dynamic_counter.counter.success = 0;
                                        dynamic_counter.counter.fails = 0;
                                        pre_compile_data.length = 0;

                                        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
                                            if (err) {
                                                console_log(`DoneEmailSending[Error]: ${err.message}`);
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
        switch (environment) {
            case 'production':
                credentials.username = "e6NG2FJ3";
                credentials.password = "PO1D19K3";
                break;
            case 'development':
                credentials.username = "N8Og84n1";
                credentials.password = "qyu5C1DA";
                break;
        }
    } else if (country_code == 'VN') {
        switch (environment) {
            case 'production':
                credentials.username = "6B9l3vO5";
                credentials.password = "K9Ov3OGF";
                break;
            case 'development':
                credentials.username = "9J3CtNdM";
                credentials.password = "m4K1c25P";
                break;
        }
    } else {
        credentials.username = "";
        credentials.password = "";
    }
}

async function storeMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id) {


    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    local_connection.query(`INSERT INTO cmw_history (config_id,campaign_name,player_token,player_contact,platform,country,message,status,created_at,updated_at,api_response,from_sender,email_subject,template_id,application_id) VALUES ('${config_id}','${campaign_name}','${player_token}','${player_contact}','${platform}','${country}','${message}','${status}','${date_now}','${date_now}','${api_response}','${from}','${email_subject}','${template_id}','${application_id}')`, (err, res) => {
        if (err) {
            console_log(`storeMessageHistory[Error]: ${err}`);
        }
    });
}


async function sendSmartSMS(message, from, phone_number, country_code) {

    apiAccount(country_code);
    const encodedParamValueMessage = encodeURIComponent(message);
    const encodedParamValueFrom = encodeURIComponent(from);
    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://my.sms-smart.com/rest/send_sms?from=${encodedParamValueFrom}&to=${phone_number}&message=${encodedParamValueMessage}&username=${credentials.username}&password=${credentials.password}`
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
function checkOddEven(row_number) {
    if (row_number % 2 === 0) {
        return JSON.stringify({ 'md5Key': 'PXFXLQGRPGPNOSGYNFRVOCPCBJKOAFCB', 'rand': '123456', orgCode: 'RAjeMitN' });
    } else {
        return JSON.stringify({ 'md5Key': 'ATRAFXBMNIBKAMOKHATQMOCCDLDEZNZU', 'rand': '123456', orgCode: 'vcGUrjSs' });
    }
}
function abosendAPIParameters(country_code, phone_number, message, row_number) {

    const api_details = JSON.parse(checkOddEven(row_number));
    const data_encrytpion = `${api_details.orgCode}${message}${api_details.rand}${api_details.md5Key}`;
    const hash = md5(data_encrytpion).toUpperCase();


    if (country_code == 'IN') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+91',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'ID') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+62',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'JP') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+81',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'MY') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+60',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'TH') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+66',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'VN') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+84',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;
    } else if (country_code == 'PH') {
        let data = qs.stringify({
            'orgCode': api_details.orgCode,
            'mobileArea': '+63',
            'rand': api_details.rand,
            'content': message,
            'mobiles': phone_number,
            'sign': hash
        });
        return data;

    } else {
        let data = qs.stringify({
            'orgCode': '',
            'mobileArea': '',
            'rand': '',
            'content': '',
            'mobiles': '',
            'sign': ''
        });
        return data;
    }
}
async function sendAbosendSMS(message, from, phone_number, country_code, row_number) {
    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://smsapi.abosend.com:8205/api/sendSMS',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: abosendAPIParameters(country_code, phone_number, message, row_number)
        };

        axios.request(config)
            .then((response) => {
                if (response.data.code == '200')
                    resolve(response)
                else
                    reject(response);
            })
            .catch((error) => {
                reject(error);
            });

    });

}






async function sendEmail(from, email, subject, template_id, fromName) {


    const apikey = '7C41D4746E1C491FAB5CC72DFF9EF3F117A02CD035AEACE30E9823CD3D0581D20B61291546D6AF53BEA633563CE388E8'
    const email_subject = subject ? encodeURIComponent(subject) : encodeURIComponent('(no subject)');
    const encodedfromName = encodeURIComponent(fromName);

    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subject}&fromName=${encodedfromName}&from=${from}&to=${email}&template=${template_id}&isTransactional=true&apikey=${apikey}`,
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


    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const sending = _req.body.sending == 'on' ? true : false;
    const is_scheduled = _req.body.is_scheduled == 'on' ? true : false;
    const data_leads = _req.body.data_source == 'csv' ? _req.files.data_leads[0].filename : Buffer.from(_req.body.data_leads).toString('base64');
    const start_at = _req.body.start_at;
    let parseISO = new Date(start_at).toISOString();
    const parseStartAt = new Date(parseISO).toLocaleString();
    local_connection.query(`INSERT INTO cmw_config(status,triggerstatus,created_at,updated_at,start_at,sending,data_source,campaign_name,data_leads,is_scheduled) VALUES ('pending','active','${date_now}','${date_now}','${parseStartAt}','${sending}','${_req.body.data_source}','${_req.body.campaign_name}','${data_leads}','${is_scheduled}')`, (err, res) => {
        if (err) {
            console_log(`insertConfig[Error]: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] });
        }
    });

}

insertProvider = async (_req, _res) => {

    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const platform = _req.body.platform == 'sms' ? 'SMS' : 'EMAIL';

    local_connection.query(`INSERT INTO cmw_providers (provider_name,application_id,provider_code,platform,endpoint,created_at,updated_at) VALUES ('${_req.body.provider_name}','${_req.body.application_id}',(SELECT concat('${platform}', MAX(provider_id)+1) FROM cmw_providers),'${_req.body.platform}','${_req.body.endpoint}','${date_now}','${date_now}')`, (err, res) => {
        if (err) {
            console_log(`insertProvider[Error]: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Provider Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Provider Added', 'data': [] });
        }
    });

}

insertProviderAccount = async (_req, _res) => {

    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();

    local_connection.query(`INSERT INTO cmw_acct_providers (country_code,provider_code,username,password,apikey,md5Key,rand,orgCode,created_at,updated_at) VALUES ('${_req.body.country_code}','${_req.body.provider_code}','${_req.body.username}','${_req.body.password}','${_req.body.apikey}','${_req.body.md5Key}','${_req.body.rand}','${_req.body.orgCode}','${date_now}','${date_now}')`, (err, res) => {
        if (err) {
            console_log(`insertProviderAccount[Error]: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] });
        }
    });

}


searchJoystck = async (_req, _res) => {

    joystick_connection.query(`select * from  afun_afun.player_data pd  limit 1`, (err, res) => {
        if (err) {
            console_log(`searchJoystck[Error]: ${err.message}`);
            setTimeout(joystick_client, 60000);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] });
        }
    });

}





API_DisplayTriggers = async (_req, _res) => {
    const { page, limit, campaign_name, status, triggerstatus, created_at, is_scheduled, data_source, start_at } = _req.query;
    const offset = (page - 1) * limit;

    // console.log(_req.query);
    try {

        let query = `select  config_id,status,triggerstatus,created_at,data_source,campaign_name,is_scheduled,start_at from cmw_config`;

        const queryParams = [];

        if (campaign_name) {
            queryParams.push(`campaign_name LIKE '%${campaign_name}%'`);
        }

        if (status) {
            const parseStatus = JSON.parse(`${_req.query.status}`);
            queryParams.push(`status LIKE '%${parseStatus.value}%'`);
        }

        if (triggerstatus) {
            const parseTriggerStatus = JSON.parse(`${_req.query.triggerstatus}`);
            queryParams.push(`triggerstatus = '${parseTriggerStatus.value}'`);
        }

        if (created_at) {
            queryParams.push(`created_at::text LIKE '%${created_at}%'`);
        }

        if (is_scheduled) {
            const parseIsSchedule = JSON.parse(`${_req.query.is_scheduled}`);
            queryParams.push(`is_scheduled = '${parseIsSchedule.value}'`);
        }

        if (data_source) {
            const parseDataSource = JSON.parse(`${_req.query.data_source}`);
            queryParams.push(`data_source = '${parseDataSource.value}'`);
        }
        if (start_at) {
            queryParams.push(`start_at::text LIKE '%${start_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }



        const countQuery = `SELECT COUNT(*) FROM cmw_config ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY config_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};



API_DisplayHistory = async (_req, _res) => {
    const { page, limit, player_token, campaign_name, platform, country, status, created_at } = _req.query;
    const offset = (page - 1) * limit;
    //console.log(_req.query);

    try {
        let query = `SELECT history_id, campaign_name, player_token, platform, country, status, created_at FROM cmw_history`;

        const queryParams = [];

        if (player_token) {
            queryParams.push(`player_token LIKE '%${player_token}%'`);
        }

        if (campaign_name) {
            queryParams.push(`campaign_name LIKE '%${campaign_name}%'`);
        }
        if (platform) {
            const parsePlatform = JSON.parse(`${_req.query.platform}`);
            queryParams.push(`platform LIKE '%${parsePlatform.value}%'`);
        }
        if (country) {
            const parseCountry = JSON.parse(`${_req.query.country}`);
            queryParams.push(`country LIKE '%${parseCountry.value}%'`);
        }
        if (status) {
            const parseStatus = JSON.parse(`${_req.query.status}`);
            queryParams.push(`status LIKE '%${parseStatus.value}%'`);
        }
        if (created_at) {
            queryParams.push(`created_at::text LIKE '%${created_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }

        const countQuery = `SELECT COUNT(*) FROM cmw_history ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY history_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};





const getELasticEmailLogs = async function () {
    const apiKey = '7C41D4746E1C491FAB5CC72DFF9EF3F117A02CD035AEACE30E9823CD3D0581D20B61291546D6AF53BEA633563CE388E8';

    const now = new Date();
    //const from = new Date(now.getTime() - 60000).toISOString();  //every 1minute
    const from = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); //every 30mins
    const to = now.toISOString();
    //const from = '2023-04-22T18:05:40.845Z'; //static from
    //const to = '2023-04-22T18:30:40.845Z'; //static to
    console.log('FROM: ', from + " TO: ", to)
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.elasticemail.com/v2/log/events?statuses=0&apikey=${apiKey}&from=${from}&to=${to}`,
        headers: {}
    };

    try {
        // Make the HTTP request using Axios
        const response = await axios(config);

        response.data.data.recipients.forEach(data => {
            local_connection.query(`INSERT INTO cmw_email_logs (jobid,msgid,fromemail,"to",subject,eventtype,eventdate,channel,channelid,messagecategory,nexttryon,message,ipaddress,ippoolname) VALUES ('${data.jobid}','${data.msgid}','${data.fromemail}','${data.to}','${data.subject}','${data.eventtype}','${data.eventdate}','${data.channel}','${data.channelid}','${data.messagecategory}','${data.nexttryon}','${data.message}','${data.ipaddress}','${data.ippoolname}')`, (err, res) => {
                if (err) {
                    console_log(`getELasticEmailLogs[Error]: ${err}`);
                }
            });
        });
        console.log("Cron Email Logs Result : ", response.data.data.recipients.length);


    } catch (error) {
        console.error('API call failed:', error.message);
    }
};
//getELasticEmailLogs();
const job = cron.schedule('*/30 * * * *', getELasticEmailLogs);


module.exports = function (app) {

    app.post('/upload/upload-config', upload.fields([
        {
            name: "data_leads",
            maxCount: 1,
        }
    ]), insertConfig);

    app.post('/upload/upload-provider', upload.fields([]), insertProvider);

    app.post('/upload/provider-account', upload.fields([]), insertProviderAccount);

    app.get('/search_joystick', searchJoystck);

    app.get('/api_triggers', API_DisplayTriggers);

    app.get('/api_history', API_DisplayHistory);


};