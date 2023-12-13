const ControllerCallback = require('../Http/Controller/ControllerCallbackAPI');
const _ControllerCallback = new ControllerCallback();
const cron = require("node-cron");

 
async function CB() {

    const res = await _ControllerCallback.GetCallbackItems();
    const data = res.rows;
    data.forEach(async row => {

        let dynamic_counter = {};
        let counter_name = `${row.id}`;

        dynamic_counter[counter_name] = { attempt: 0 };
        //console.log(dynamic_counter[`${row.id}`].attempt);
        switch (row.application_id) {
            case 'EMAIL_EE':
                await _ControllerCallback.GetElasticSendingCallback(row.api_response, row.country)
                    .then(async function (response) {
                        /*
                        console.log('----------SUCCESS-----------');
                        console.log(response);*/
                        const jsonObject = JSON.parse(response);
                        const status = jsonObject.status;
                        dynamic_counter[`${row.id}`].attempt++;

                        if (status === 'Throttled') { 
                            await _ControllerCallback.GetUpdateCallback(row.id, status, response)
                                .then(async function () {
                                    await _ControllerCallback.SpinWheelCallback(row.callback_url, JSON.stringify({ id: row.id, status: status, response: response }));
                                });
                        } else if (status === 'Sent') { 
                            await _ControllerCallback.GetUpdateCallback(row.id, 'Received', response)
                                .then(async function () {
                                    await _ControllerCallback.SpinWheelCallback(row.callback_url, JSON.stringify({ id: row.id, status: 'Received', response: response }));
                                });;
                        }

                    }).catch(async function (error) {
                        /*
                        console.log('----------ERROR-----------');
                        console.log(error);*/
                        const jsonObject = JSON.parse(error);
                        const status = jsonObject.status;
                        await _ControllerCallback.GetUpdateCallback(row.id, status, error);
                    }).finally(async function () {
                        //console.log(`Attempt : ${dynamic_counter[`${row.id}`].attempt}`);
                        await _ControllerCallback.GetUpdateCallbackAttempt(row.id, dynamic_counter[`${row.id}`].attempt)
                            .then(async function (response) {
                                //console.log(response);
                                dynamic_counter[`${row.id}`].attempt = 0;
                            });
                    });
                break;
            /*
        case 'SMS_ABOSEND':
            console.log('Abosend : ', row.history_id);
            break;
        case 'SMS_SMART':
            console.log('Smart SMS : ', row.history_id);
            break;
        case 'SMS_ABENLA':
            console.log('Abenla SMS : ', row.history_id);
            break;
        case 'SMS_TEXT_LOCAL':
            console.log('TextLocal SMS : ', row.history_id);
            break;*/
        }
    })
}
CB();

var cronJob = cron.schedule("*/30 * * * *", CB, false);
cronJob.start();
