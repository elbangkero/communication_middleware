
const { local_connection, joystick_connection } = require('../utils/db_connection');
const { SpinTheWheelSender } = require('./custom_site_api/wheel_api');
const { ElasticEmailSender } = require('./provider_api/elastic_email');
const { AbenlaSMSSender } = require('./provider_api/abenla_sms');
const { AbosendSMSSender } = require('./provider_api/abosend_sms');
const { SmartSMSSender } = require('./provider_api/smart_sms');
const { TextLocalSender } = require('./provider_api/textLocal_sms');
const ControllerAPI = require('./Http/Controller/ControllerAPI');
const _ControllerAPI = new ControllerAPI();
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const schedule = require('node-schedule');



const interval = `${process.env.INTERVAL_TIME}`;
const throttling = `${process.env.THROTTLING_TIME}`;

//let counter = { fails: 0, success: 0 };
(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN cmw_listener');
    client.on('notification', function (data) {
        getConfig(parseInt(data.payload));
        //console.log("data", JSON.parse(data.payload)) ;
        function getConfig(dataload) {
            setTimeout(async () => {
                const res = await _ControllerAPI.GetListenerPayload();
                const data = res.rows;
                console_log(`Config queue count : ${res.rowCount}`);

                console_log(`payload : ${dataload}`);
                const callback = dataload == res.rowCount;
                if (callback) {
                    data.forEach(async row => {
                        const data_source = row.data_source;
                        switch (data_source) {
                            case 'json':
                                try {
                                    var pre_compile_data = [];
                                    var dynamic_contact = row.config_id;
                                    pre_compile_data[dynamic_contact];

                                    const utf8encoded = (new Buffer.from(row.data_leads, 'base64')).toString('utf8');
                                    const obj = JSON.parse(utf8encoded);


                                    let result = Array.isArray(obj.data_leads.playertoken);
                                    if (result) {
                                        obj.data_leads.playertoken.forEach((token) => {
                                            pre_compile_data.push(JSON.stringify({ 'player_token': token, 'message_text': obj.data_leads.message_text, 'platform': obj.data_leads.platform, 'from': obj.data_leads.from, 'template_id': obj.data_leads.template_id, 'email_subject': obj.data_leads.email_subject, 'fromName': obj.data_leads.fromName, 'application_id': obj.data_leads.application_id, 'merge': obj.data_leads.merge, 'callback_url': obj.data_leads.callback_url }));
                                        });
                                    } else {
                                        pre_compile_data.push(JSON.stringify({ 'player_token': obj.data_leads.playertoken, 'message_text': obj.data_leads.message_text, 'platform': obj.data_leads.platform, 'from': obj.data_leads.from, 'template_id': obj.data_leads.template_id, 'email_subject': obj.data_leads.email_subject, 'fromName': obj.data_leads.fromName, 'application_id': obj.data_leads.application_id, 'merge': obj.data_leads.merge, 'callback_url': obj.data_leads.callback_url }));
                                    }


                                    if (row.is_scheduled == true) {
                                        const job = schedule.scheduleJob(`${row.config_id}`, row.start_at, async function () {
                                            constructData(row.config_id, pre_compile_data, row.campaign_name, row.site_id);
                                        });
                                    } else {
                                        constructData(row.config_id, pre_compile_data, row.campaign_name, row.site_id);
                                    }

                                    await _ControllerAPI.GetUpdateConfigSending(row.config_id);


                                } catch (err) {
                                    await _ControllerAPI.GetUpdateConfigSent(row.config_id);
                                    console_log(err);
                                    console_log('Error Json format');
                                }
                                //console.log(pre_compile_data);
                                break;
                            case 'csv':


                                let retryCounts = {};

                                var pre_compile_data = [];
                                var dynamic_contact = row.config_id;
                                pre_compile_data[dynamic_contact];

                                const filePath = './uploads/data_leads/' + row.data_leads;

                                async function processFile(maxRetries) {
                                    try {
                                        //throw new Error("Forced error for testing");
                                        if (fs.existsSync(filePath)) {
                                            fs.createReadStream(filePath)
                                                .pipe(csv())
                                                .on('data', function (data) {
                                                    const sanitizedData = Object.fromEntries(
                                                        Object.entries(data).map(([key, value]) => [
                                                            key.replace(/[\s']/g, ''),
                                                            value === '' ? null : value
                                                        ])
                                                    );

                                                    try {
                                                        pre_compile_data.push(JSON.stringify({
                                                            'player_token': sanitizedData.playertoken,
                                                            'message_text': sanitizedData.message_text,
                                                            'platform': sanitizedData.platform,
                                                            'from': sanitizedData.from,
                                                            'template_id': sanitizedData.template_id,
                                                            'email_subject': sanitizedData.email_subject,
                                                            'fromName': sanitizedData.fromName,
                                                            'application_id': sanitizedData.application_id,
                                                            'merge': sanitizedData.merge
                                                        }));
                                                    } catch (err) {
                                                        console.log(err);
                                                        console.log('error contact number');
                                                    }
                                                })
                                                .on('end', async () => {
                                                    //console.log(pre_compile_data);
                                                    if (row.is_scheduled == true) {
                                                        const job = schedule.scheduleJob(`${row.config_id}`, row.start_at, async function () {
                                                            constructData(row.config_id, pre_compile_data, row.campaign_name, row.site_id);
                                                        });
                                                    } else {
                                                        constructData(row.config_id, pre_compile_data, row.campaign_name, row.site_id);
                                                    }

                                                    await _ControllerAPI.GetUpdateConfigSending(row.config_id);
                                                });
                                        } else {
                                            if (!retryCounts[dynamic_contact]) {
                                                retryCounts[dynamic_contact] = 0;
                                            }

                                            if (retryCounts[dynamic_contact] < maxRetries) {
                                                retryCounts[dynamic_contact]++;
                                                await _ControllerAPI.GetUpdateConfigSending(row.config_id);
                                                console.log(`Retrying (attempt ${retryCounts[dynamic_contact]})...`, dynamic_contact);
                                                setTimeout(() => processFile(maxRetries), 5000);
                                            } else {
                                                console.log('Maximum retries reached. Unable to process file.');
                                                await _ControllerAPI.GetUpdateConfigSent(row.config_id);
                                            }
                                        }
                                    } catch (err) {
                                        //console.log('error detected');
                                        if (!retryCounts[dynamic_contact]) {
                                            retryCounts[dynamic_contact] = 0;
                                        }

                                        if (retryCounts[dynamic_contact] < maxRetries) {
                                            retryCounts[dynamic_contact]++;
                                            await _ControllerAPI.GetUpdateConfigSending(row.config_id);
                                            console.log(`Retrying (attempt ${retryCounts[dynamic_contact]})...`, dynamic_contact);
                                            setTimeout(() => processFile(maxRetries), 5000);
                                        } else {
                                            console.log('Maximum retries reached. Unable to process file.');
                                            await _ControllerAPI.GetUpdateConfigSent(row.config_id);
                                        }
                                    }
                                }

                                const maxRetries = 3;
                                processFile(maxRetries);


                                break;



                            default:
                                console_log('Incorrect Dataleads');
                        }
                    })

                }
            }, throttling)
        }

    });
    //counter.success = 0;
    //counter.fails = 0;


})();


function constructData(config_id, pre_compile_data, campaign_name, site_id) {



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
            await _ControllerAPI.GetUserInfoFromJoystick(obj.player_token)
                .then(async function (response) {
                    const data = response.rows;
                    data.forEach(async row => {
                        //SPECIFY SITE SENDER
                        const data = await _ControllerAPI.GetSiteName(site_id);
                        if (data.length === 0 || data[0].sitename === 'Invalid') {
                            //console.log('Invalid');
                            console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                            dynamic_counter.counter.fails++
                            query_instant++
                            await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, '', row.country, obj.message_text, 'failed', '{"message":"Invalid Site ID"}', obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                            if (pre_compile_data.length == query_instant) {
                                console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                dynamic_counter.counter.success = 0;
                                dynamic_counter.counter.fails = 0;
                                pre_compile_data.length = 0;
                                await _ControllerAPI.GetUpdateConfigSent(config_id);
                            }
                            return;
                        } else if (res.rowCount != 0 && data[0].sitename === 'Spin The Wheel') {
                            //console.log('Spin The Wheel');
                            const sitename = data[0].sitename;
                            await _ControllerAPI.GetProviders(obj.application_id)
                                .then(async function (response) {
                                    const data = response.rows;
                                    data.forEach(async row_provider => {
                                        if (row_provider.provider_code == process.env.PROVIDER_ELASTIC_EMAIL) {
                                            obj.merge += `&playername=${row.playername}`;
                                            await SpinTheWheelSender(obj.from, row.email, obj.email_subject, obj.template_id, obj.fromName, row.country, obj.merge).then(async function (response) {
                                                console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                query_instant++
                                                dynamic_counter.counter.success++;
                                                await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                            }).catch(async function (error) {
                                                console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                dynamic_counter.counter.fails++
                                                query_instant++
                                                await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                            }).finally(async function () {
                                                if (pre_compile_data.length == query_instant) {
                                                    console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                    dynamic_counter.counter.success = 0;
                                                    dynamic_counter.counter.fails = 0;
                                                    pre_compile_data.length = 0;
                                                    await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                }
                                            });
                                        } else {
                                            console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                            dynamic_counter.counter.fails++
                                            query_instant++
                                            await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', `{"message":"Provider does not exist"}`, obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                            if (pre_compile_data.length == query_instant) {
                                                console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                dynamic_counter.counter.success = 0;
                                                dynamic_counter.counter.fails = 0;
                                                pre_compile_data.length = 0;
                                                await _ControllerAPI.GetUpdateConfigSent(config_id);
                                            }
                                        }

                                    });
                                    if (data.length === 0) {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                        await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', `{"message":"Provider does not exist"}`, obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    }
                                }).catch(async function (err) {
                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, '', 'email', row.country, obj.message_text, 'failed', err.message, obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url).then(async function (response) {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                    }).finally(async function () {
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    });
                                });
                            return;
                        }
                        //SPECIFY SITE SENDER



                        //GENERAL SENDER
                        if (obj.platform == 'sms') {
                            await _ControllerAPI.GetProviders(obj.application_id)
                                .then(async function (response) {
                                    const data = response.rows;
                                    data.forEach(async row_provider => {
                                        if (row_provider.provider_code == process.env.PROVIDER_SMS_SMART) {
                                            const from_value = obj.from.length === 0 ? "CMW" : obj.from;
                                            await SmartSMSSender(obj.message_text, obj.from, row.phone_number, row.country)
                                                .then(async function (response) {
                                                    //console.log('success');
                                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                    //counter.success++;
                                                    query_instant++
                                                    dynamic_counter.counter.success++;
                                                    //console.log(response.data);
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'success', JSON.stringify(response.data), from_value, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .catch(async function (error) {
                                                    //console.log('error');
                                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                    //counter.fails++;
                                                    dynamic_counter.counter.fails++
                                                    query_instant++
                                                    //console.error(error.response.data);
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', JSON.stringify(error.response.data), from_value, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .finally(async function () {
                                                    if (pre_compile_data.length == query_instant) {

                                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                        dynamic_counter.counter.success = 0;
                                                        dynamic_counter.counter.fails = 0;
                                                        pre_compile_data.length = 0;
                                                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                    }
                                                });
                                        } else if (row_provider.provider_code == process.env.PROVIDER_ABOSEND) {
                                            await AbosendSMSSender(obj.message_text, obj.from, row.phone_number, row.country, row_number)
                                                .then(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                    query_instant++
                                                    dynamic_counter.counter.success++;
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .catch(async function (error) {
                                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                    dynamic_counter.counter.fails++
                                                    query_instant++
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .finally(async function () {
                                                    if (pre_compile_data.length == query_instant) {
                                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                        dynamic_counter.counter.success = 0;
                                                        dynamic_counter.counter.fails = 0;
                                                        pre_compile_data.length = 0;
                                                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                    }
                                                });
                                        } else if (row_provider.provider_code == process.env.PROVIDER_ABENLA_SMS) {
                                            await AbenlaSMSSender(obj.message_text, row.phone_number, row.country, row.classificationcode)
                                                .then(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                    query_instant++
                                                    dynamic_counter.counter.success++;
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .catch(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                    dynamic_counter.counter.fails++
                                                    query_instant++
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .finally(async function () {
                                                    if (pre_compile_data.length == query_instant) {
                                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                        dynamic_counter.counter.success = 0;
                                                        dynamic_counter.counter.fails = 0;
                                                        pre_compile_data.length = 0;
                                                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                    }
                                                });
                                        } else if (row_provider.provider_code == process.env.PROVIDER_TEXT_LOCAL_SMS) {
                                            await TextLocalSender(obj.from, obj.message_text, row.phone_number)
                                                .then(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                    query_instant++
                                                    dynamic_counter.counter.success++;
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .catch(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                    dynamic_counter.counter.fails++
                                                    query_instant++
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', JSON.stringify(response.data), obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                })
                                                .finally(async function () {
                                                    if (pre_compile_data.length == query_instant) {
                                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                        dynamic_counter.counter.success = 0;
                                                        dynamic_counter.counter.fails = 0;
                                                        pre_compile_data.length = 0;
                                                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                    }
                                                });
                                        }
                                        //provider checker if existing
                                        else {
                                            console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                            dynamic_counter.counter.fails++
                                            query_instant++
                                            await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', '{"message":"Provider does not exist in sms platform"}', obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                            if (pre_compile_data.length == query_instant) {
                                                console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                dynamic_counter.counter.success = 0;
                                                dynamic_counter.counter.fails = 0;
                                                pre_compile_data.length = 0;
                                                await _ControllerAPI.GetUpdateConfigSent(config_id);
                                            }

                                        }
                                    });
                                    //provider checker if existing
                                    if (data.length === 0) {

                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                        await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.phone_number, 'sms', row.country, obj.message_text, 'failed', '{"message":"Provider does not exist in sms platform"}', obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    }
                                })
                                .catch(async function (err) {
                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, '', 'sms', row.country, obj.message_text, 'failed', err.message, obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url).then(async function (response) {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                    }).finally(async function () {
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    });
                                });
                        }
                        else if (obj.platform == 'email') {
                            await _ControllerAPI.GetProviders(obj.application_id)
                                .then(async function (response) {
                                    const data = response.rows;
                                    data.forEach(async row_provider => {
                                        if (row_provider.provider_code == process.env.PROVIDER_ELASTIC_EMAIL) {
                                            await ElasticEmailSender(obj.from, row.email, obj.email_subject, obj.template_id, obj.fromName, row.country, obj.merge)
                                                .then(async function (response) {
                                                    console_log(`Status : ${obj.player_token} Sent, ` + `Campaign : ${campaign_name}`);
                                                    query_instant++
                                                    dynamic_counter.counter.success++;
                                                    // console.log(JSON.stringify(response.data));
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'success', JSON.stringify(response.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                }).catch(async function (error) {
                                                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                                    dynamic_counter.counter.fails++
                                                    query_instant++
                                                    //console.log(error.data);
                                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', JSON.stringify(error.data), obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                                }).finally(async function () {
                                                    if (pre_compile_data.length == query_instant) {
                                                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                        dynamic_counter.counter.success = 0;
                                                        dynamic_counter.counter.fails = 0;
                                                        pre_compile_data.length = 0;
                                                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                                                    }
                                                });



                                        } else {
                                            console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                            dynamic_counter.counter.fails++
                                            query_instant++
                                            await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', '{"message":"Provider does not exist in email platform"}', obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                            if (pre_compile_data.length == query_instant) {
                                                console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                                dynamic_counter.counter.success = 0;
                                                dynamic_counter.counter.fails = 0;
                                                pre_compile_data.length = 0;
                                                await _ControllerAPI.GetUpdateConfigSent(config_id);
                                            }
                                        }

                                    });
                                    if (data.length === 0) {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                        await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, row.email, 'email', row.country, obj.message_text, 'failed', '{"message":"Provider does not exist in email platform"}', obj.from, obj.email_subject, obj.template_id, obj.application_id, obj.merge, row.brandcode, obj.callback_url);
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    }
                                }).catch(async function (err) {
                                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, '', 'email', row.country, obj.message_text, 'failed', err.message, obj.from, '', '', obj.application_id, obj.merge, row.brandcode, obj.callback_url).then(async function (response) {
                                        console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                                        dynamic_counter.counter.fails++
                                        query_instant++
                                    }).finally(async function () {
                                        if (pre_compile_data.length == query_instant) {
                                            console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                                            dynamic_counter.counter.success = 0;
                                            dynamic_counter.counter.fails = 0;
                                            pre_compile_data.length = 0;
                                            await _ControllerAPI.GetUpdateConfigSent(config_id);
                                        }
                                    });
                                });
                        }
                        //GENERAL SENDER
                    });

                })
                .catch(async function (err) {
                    console_log(`Status : ${obj.player_token} Failed, ` + `Campaign : ${campaign_name}`);
                    dynamic_counter.counter.fails++
                    query_instant++
                    await _ControllerAPI.GetStoreMessageHistory(config_id, campaign_name, obj.player_token, '', obj.platform, '', obj.message_text, 'failed', err, obj.from, '', '', obj.application_id, obj.merge, '');
                }).finally(async function () {
                    if (pre_compile_data.length == query_instant) {
                        console_log(`Campaign: ${campaign_name}, Result: ${dynamic_counter.counter.success} sent, ${dynamic_counter.counter.fails} failed`);
                        dynamic_counter.counter.success = 0;
                        dynamic_counter.counter.fails = 0;
                        pre_compile_data.length = 0;
                        await _ControllerAPI.GetUpdateConfigSent(config_id);
                    }
                });
        }, index * interval);
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
        /*
        if (!file.originalname.match(/\.csv$|\.xlsx$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a CSV or xlsx file only'))
        }*/
        cb(null, true)
    }


};

upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});


insertConfig = async (_req, _res) => {

    let data_leads;
    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const sending = _req.body.sending == 'on' ? true : false;
    const is_scheduled = _req.body.is_scheduled == 'on' ? true : false;
    //const data_leads = _req.body.data_source == 'csv' ? _req.files.data_leads[0].filename : Buffer.from(_req.body.data_leads).toString('base64');
    if (_req.body.data_source == 'csv') {
        if (_req.files.data_leads && _req.files.data_leads.length > 0 && _req.files.data_leads[0].filename) {
            data_leads = _req.files.data_leads[0].filename;
        } else {
            data_leads = 'Invalid Data Leads';
            message = 'Data leads must be CSV or xlsx file only';
            _res.status(400).json({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message });
            console_log(JSON.stringify({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message }));
            return;
        }
    } else if (_req.body.data_source == 'json') {
        if (_req.body.data_leads) {
            data_leads = _req.body.data_leads
        } else {
            data_leads = 'Invalid Data Leads';
            message = 'Data leads must be encoded in base64';
            _res.status(400).json({ 'statusCode': 400, 'status': false, message: data_leads, 'Message': message });
            console_log(JSON.stringify({ 'statusCode': 400, 'status': false, message: data_leads, 'Message': message }));
            return;
        }
    } else {
        data_leads = 'Invalid Data Source';
        message = 'Data Source does not exist';
        _res.status(400).json({ 'statusCode': 400, 'status': false, 'ErrorMessage': data_leads, 'Message': message });
        console_log(JSON.stringify({ 'statusCode': 400, 'status': false, 'ErrorMessage': data_leads, 'Message': message }));
        return;
    }

    const start_at = _req.body.start_at;
    const parsedDate = new Date(start_at);

    var parseISO = !isNaN(parsedDate) ? parsedDate.toISOString() : '1998-10-06 00:00:00.000';
    const site_id = await _ControllerAPI.GetValidateSiteID(_req.body.site_id) ? _req.body.site_id : 1;

    await _ControllerAPI.GetInsertConfig(local_time, parseISO, sending, _req.body.data_source, _req.body.campaign_name, data_leads, is_scheduled, site_id)
        .then(async function (response) {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] });
        });


}

insertProvider = async (_req, _res) => {

    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const platform = _req.body.platform == 'sms' ? 'SMS' : 'EMAIL';

    await _ControllerAPI.GetInsertProviders(_req.body.provider_name, _req.body.application_id, platform, _req.body.platform, _req.body.endpoint, local_time)
        .then(async function (response) {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Provider Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Provider Added', 'data': [] });
        });

}

insertProviderAccount = async (_req, _res) => {

    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();

    await _ControllerAPI.GetInsertAcctProviders(_req.body.country_code, _req.body.provider_code, _req.body.username, _req.body.password, _req.body.apikey, _req.body.md5key, _req.body.rand, _req.body.orgCode, local_time)
        .then(async function (response) {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Provider Account Added', 'data': [] });
        });

}


stopScheduled = async (_req, _res) => {
    await _ControllerAPI.GetStopScheduled(_req.params.id)
        .then(async function (response) {
            try {
                var my_job = schedule.scheduledJobs[_req.params.id];
                my_job.cancel();
                console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] }));
                _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] });
            } catch (err) {
                console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] }));
                _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Scheduled Stop', 'data': [] });
            }
        });
}


module.exports = function (app, jwt) {

    function verifyToken(req, res, next) {
        const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
        const jwtSecretKey = process.env.JWT_SECRET_KEY;
        const statusCode = '400';
        const message = 'Token Verification Failed';
        try {
            const token = req.header(tokenHeaderKey);
            const verified = jwt.verify(token, jwtSecretKey);
            if (verified) {
                next();
            } else {

                console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
                res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
                return;
            }
        } catch (error) {
            console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
            res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
            return;
        }
    }

    app.post('/upload/upload-config', upload.fields([
        {
            name: "data_leads",
            maxCount: 1,
        }
    ]), verifyToken, insertConfig);

    app.post('/upload/upload-provider', upload.fields([]), verifyToken, insertProvider);

    app.post('/upload/provider-account', upload.fields([]), verifyToken, insertProviderAccount);

    app.post('/stop_scheduled/:id', upload.fields([]), verifyToken, stopScheduled);



};