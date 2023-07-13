
const { local_connection, joystick_connection, joystick_client } = require('../utils/db_connection');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
var axios = require('axios');
const schedule = require('node-schedule');
const qs = require('qs');
const md5 = require("md5");

var interval = 3000;

let provider_code = {
    "PROVIDER_SMS_SMART": "SMS11", //Smart SMS
    "PROVIDER_ABOSEND": "SMS12", //Abosend SMS
    "PROVIDER_ELASTIC_EMAIL": "EMAIL10" //Elastic Email
};

const environment = `${process.env.ENVIRONMENT}`;
//let counter = { fails: 0, success: 0 };
(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN cmw_listener');
    client.on('notification', function (data) {
        getConfig(parseInt(data.payload));
        //console.log("data", JSON.parse(data.payload)) ;
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
                                        pre_compile_data.push(JSON.stringify({ 'player_token': data.playertoken, 'country': data.country, 'message_text': data.message_text, 'platform': data.platform, 'from': data.from, 'template_id': data.template_id, 'email_subject': data.email_subject, 'fromName': data.fromName, 'application_id': data.application_id, 'merge': data.merge }));
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
                                        const job = schedule.scheduleJob(`${row.config_id}`, row.start_at, async function () {
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

                                    if (row_provider.provider_code == provider_code.PROVIDER_SMS_SMART) {

                                        await sendSmartSMS(obj.message_text, obj.from, row.phone_number, obj.country)
                                            .then(function (response) {
                                                //console.log('success');
                                                console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                //counter.success++;
                                                query_instant++
                                                dynamic_counter.counter.success++;
                                                //console.log(response.data);
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge);
                                            })
                                            .catch(function (error) {
                                                //console.log('error');
                                                console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                //counter.fails++;
                                                dynamic_counter.counter.fails++
                                                query_instant++
                                                //console.error(error.response.data);
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', JSON.stringify(error.response.data), obj.from, '', '', obj.application_id, obj.merge);
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
                                    } else if (row_provider.provider_code == provider_code.PROVIDER_ABOSEND) {
                                        await sendAbosendSMS(obj.message_text, obj.from, row.phone_number, obj.country, row_number)
                                            .then(function (response) {
                                                console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                query_instant++
                                                dynamic_counter.counter.success++;
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge);
                                            })
                                            .catch(function (error) {
                                                console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                dynamic_counter.counter.fails++
                                                query_instant++
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, '', '', obj.application_id, obj.merge);
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
                                        storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', '{"message":"Provider does not exist"}', obj.from, '', '', obj.application_id, obj.merge);
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
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', obj.country, obj.message_text, 'failed', '{"message":"Provider does not exist"}', obj.from, '', '', obj.application_id, obj.merge);
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
                            local_connection.query(`SELECT * FROM cmw_providers where application_id = '${obj.application_id}'`).then(res => {
                                const data = res.rows;
                                data.forEach(async row_provider => {
                                    if (row_provider.provider_code == provider_code.PROVIDER_ELASTIC_EMAIL) {

                                        await sendEmail(obj.from, row.email, obj.email_subject, obj.template_id, obj.fromName, obj.country, obj.merge)
                                            .then(function (response) {
                                                console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                query_instant++
                                                dynamic_counter.counter.success++;
                                                // console.log(JSON.stringify(response.data));
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge);
                                            }).catch(function (error) {
                                                console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                dynamic_counter.counter.fails++
                                                query_instant++
                                                //console.log(error.data);
                                                storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge);
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
                                    } else {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                        storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'failed', '{"message":"Provider does not exist"}', obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge);
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
                                    }

                                });
                                if (data.length === 0) {
                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                    dynamic_counter.counter.fails++
                                    query_instant++
                                    storeMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', obj.country, obj.message_text, 'failed', '{"message":"Provider does not exist"}', obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge);
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
                                }

                            });
                            /*
                          

                                */
                        }
                    });
                }
            });
        }, index * interval);
    });

}

async function apiAccount(country_code) {
    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${provider_code.PROVIDER_SMS_SMART}' and country_code = '${country_code}' and environment = '${environment}' LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { "username": row.username, "password": row.password };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { "username": "", "password": "" };
    }
}


async function storeMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge) {


    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    local_connection.query(`INSERT INTO cmw_history (config_id,campaign_name,player_token,player_contact,platform,country,message,status,created_at,updated_at,api_response,from_sender,email_subject,template_id,application_id,merge) VALUES ('${config_id}','${campaign_name}','${player_token}','${player_contact}','${platform}','${country}','${message}','${status}','${date_now}','${date_now}','${api_response}','${from}','${email_subject}','${template_id}','${application_id}','${merge}')`, (err, res) => {
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
        const result = await apiAccount(country_code);
        var config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://my.sms-smart.com/rest/send_sms?from=${encodedParamValueFrom}&to=${phone_number}&message=${encodedParamValueMessage}&username=${result.username}&password=${result.password}`
        };

        await axios(config)
            .then(function (response) {
                resolve(response);
            })
            .catch(function (error) {
                reject(error);
            });
    });

}
async function checkOddEven() {

    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${provider_code.PROVIDER_ABOSEND}' ORDER BY random() LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { 'md5Key': row.md5key, 'rand': row.rand, 'orgCode': row.orgcode };
        })
    );
    if (results.length > 0) {
        return results[0];
    }
}
async function abosendAPIParameters(country_code, phone_number, message, row_number) {

    const api_details = await checkOddEven(row_number);
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
            data: await abosendAPIParameters(country_code, phone_number, message, row_number)
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




async function ElasticEmailAccount(country_code) {

    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${provider_code.PROVIDER_ELASTIC_EMAIL}'  and country_code like '${country_code}' LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { 'apikey': row.apikey };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { 'apikey': '' };
    }

}

async function sendEmail(from, email, subject, template_id, fromName, country_code, merge) {


    const apikey = await ElasticEmailAccount(country_code);

    const email_subject = subject ? encodeURIComponent(subject) : encodeURIComponent('(no subject)');
    const encodedfromName = encodeURIComponent(fromName);

    const merge_params = new URLSearchParams(merge);

    var merge_type = "";
    merge_params.forEach((value, key) => {
        merge_type += `&merge_${key}=${value}`;
    });

    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subject}&fromName=${encodedfromName}&from=${from}&to=${email}&template=${template_id}&isTransactional=true&apikey=${apikey.apikey}&${merge_type}`,
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
    local_connection.query(`INSERT INTO cmw_acct_providers (country_code,provider_code,username,password,apikey,md5Key,rand,orgCode,created_at,updated_at) VALUES ('${_req.body.country_code}','${_req.body.provider_code}','${_req.body.username}','${_req.body.password}','${_req.body.apikey}','${_req.body.md5key}','${_req.body.rand}','${_req.body.orgCode}','${date_now}','${date_now}')`, (err, res) => {
        if (err) {
            console_log(`insertProviderAccount[Error]: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] });
        }
    });

}


stopScheduled = async (_req, _res) => {

    local_connection.query(`update cmw_config set status= 'cancelled', is_scheduled = 'false' , triggerstatus='inactive' where config_id='${_req.params.id}'`, (err, res) => {
        if (err) {
            console_log(`stopScheduled[Error]: ${err.message}`);
        } else {
            try {

                var my_job = schedule.scheduledJobs[_req.params.id];
                my_job.cancel();
                console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] }));
                _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] });
            } catch (err) {
                console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] }));
                _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] });
            }
        }
    });

}


API_ViewHistory = async (_req, _res) => {
    local_connection.query(`select * from cmw_history where history_id ='${_req.params.id}'`, (err, res) => {
        if (err) {
            console.error('Error fetching data:', err);
            _res.status(500).json({ error: 'Internal Server Error' });
        } else {
            _res.json({ data: res.rows });
        }
    });
};




module.exports = function (app) {

    app.post('/upload/upload-config', upload.fields([
        {
            name: "data_leads",
            maxCount: 1,
        }
    ]), insertConfig);

    app.post('/upload/upload-provider', upload.fields([]), insertProvider);

    app.post('/upload/provider-account', upload.fields([]), insertProviderAccount);

    app.post('/stop_scheduled/:id', upload.fields([]), stopScheduled);

    app.get('/api_history/view-history/:id', API_ViewHistory);




};