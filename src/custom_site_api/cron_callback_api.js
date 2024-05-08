const ControllerCallback = require('../Http/Controller/ControllerCallbackAPI');
const _ControllerCallback = new ControllerCallback();
const cron = require("node-cron");






async function CB() {

    const res = await _ControllerCallback.GetCallbackItems();
    const data = res.rows;
    data.forEach(async row => {
        const res = await _ControllerCallback.GetProviderCallbackEmail();
        const data = res.rows[0].result_array;
        if (data.includes(row.application_id)) {
            await _ControllerCallback.GetElasticSendingCallback(row.api_response, row.country, row.application_id)
                .then(async function (response) {
                    const jsonObject = JSON.parse(response);
                    const status = jsonObject.status;
                    if (row.attemptcount <= 10) {
                        if (status === 'Throttled') {
                            await _ControllerCallback.GetUpdateCallbackAttempt(row.id, row.attemptcount + 1);
                            await _ControllerCallback.GetUpdateCallback(row.id, status, response)
                                .then(async function () {
                                    await _ControllerCallback.SpinWheelCallback(row.callback_url, JSON.stringify({ id: row.id, status: status, response: response }));
                                });
                        } else if (status === 'Sent') {
                            await _ControllerCallback.GetUpdateCallback(row.id, 'Received', response)
                                .then(async function () {
                                    await _ControllerCallback.SpinWheelCallback(row.callback_url, JSON.stringify({ id: row.id, status: 'Received', response: response }));
                                });
                        }
                    }

                }).catch(async function (error) {
                    await _ControllerCallback.GetUpdateCallback(row.id, 'Undelivered', JSON.stringify(error));
                });
        } else if (row.application_id === 'ANTS_SMS') {
            await _ControllerCallback.GetAntsCallBack(row)
                .then(async function (response) {
                    const jsonObject = JSON.parse(response);
                    const status = jsonObject.status;
                    if (row.attemptcount <= 10) {
                        if (status == 'PENDING' || status == 'COMPLETED') {
                            await _ControllerCallback.GetUpdateCallbackAttempt(row.id, row.attemptcount + 1);
                        }

                        else if (status == 'DELIVERED') {
                            await _ControllerCallback.GetUpdateCallback(row.id, 'Received', jsonObject.id);
                        }
                    }
                }).catch(async function (error) {
                    await _ControllerCallback.GetUpdateCallback(row.id, 'Undelivered', JSON.stringify(error));
                });
        }
    })
}
CB();

var cronJob = cron.schedule("*/15 * * * *", CB, false);
cronJob.start();
