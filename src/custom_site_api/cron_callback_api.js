const ControllerCallback = require('../Http/Controller/ControllerCallbackAPI');
const _ControllerCallback = new ControllerCallback();
const cron = require("node-cron");

function CB() {
    setTimeout(async () => {
        const res = await _ControllerCallback.GetCallbackItems();
        const data = res.rows;
        data.forEach(async row => {
            switch (row.application_id) {
                case 'EMAIL_EE':
                    await _ControllerCallback.GetElasticSendingCallback(row.api_response, row.country)
                        .then(async function (response) {
                            const jsonObject = JSON.parse(response);
                            const status = jsonObject.status;
                            if (status === 'Throttled')
                                await _ControllerCallback.GetUpdateCallback(row.id, status, error);
                            else if (status === 'Sent')
                                await _ControllerCallback.GetUpdateCallback(row.id, 'Received', response);
                        }).catch(async function (error) {
                            const jsonObject = JSON.parse(error);
                            const status = jsonObject.status;
                            await _ControllerCallback.GetUpdateCallback(row.id, status, error);
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
    }, 10000);
}
CB();

var cronJob = cron.schedule("*/30 * * * *", CB, false);
cronJob.start();
