const ControllerCallback = require('../Http/Controller/ControllerCallbackAPI');
const _ControllerCallback = new ControllerCallback();
const cron = require("node-cron");

async function Throttled() {
    console.log('running Throttled');
    const res = await _ControllerCallback.GetCallbackItems('Throttled');
    const data = res.rows;
    data.forEach(async row => {
        console.log(`THROTTLED ID : ${row.id}`);
    })
}

async function CB() {


    let dynamic_counter = {};
    let counter_name = 'counter';

    dynamic_counter[counter_name] = { attempt: 0 };



    const res = await _ControllerCallback.GetCallbackItems('Pending');
    const data = res.rows;
    data.forEach(async row => {

        dynamic_counter.counter.attempt++;
        switch (row.application_id) {
            case 'EMAIL_EE':
                await _ControllerCallback.GetElasticSendingCallback(row.api_response, row.country)
                    .then(async function (response) {
                        /*
                        console.log('----------SUCCESS-----------');
                        console.log(response);*/
                        const jsonObject = JSON.parse(response);
                        const status = jsonObject.status;
                        if (status === 'Throttled')
                            await _ControllerCallback.GetUpdateCallback(row.id, status, response);
                        else if (status === 'Sent')
                            await _ControllerCallback.GetUpdateCallback(row.id, 'Received', response);
                    }).catch(async function (error) {
                        /*
                        console.log('----------ERROR-----------');
                        console.log(error);*/
                        console.log(error);
                        const jsonObject = JSON.parse(error);
                        const status = jsonObject.status;
                        await _ControllerCallback.GetUpdateCallback(row.id, status, error);
                    }).finally(async function () {
                        console.log(`Attempt : ${dynamic_counter.counter.attempt}`);
                        await _ControllerCallback.GetUpdateCallbackAttempt(row.id, dynamic_counter.counter.attempt);
                        dynamic_counter.counter.attempt = 0;
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

var cronJob = cron.schedule("*/1 * * * * *", CB, false);
cronJob.start();
