const Callback = require('../Classes/Callback');
const _Callback = new Callback();
const AcctProviders = require('../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();
const axios = require('axios');
const https = require('https');

const PROVIDER_ELASTIC_EMAIL = process.env.PROVIDER_ELASTIC_EMAIL;


async function GetCallbackItems() {
    return await _Callback.SetCallbackItems();
}

async function GetUpdateCallback(id, callback_status, api_response) {
    return await _Callback.SetUpdateCallback(id, callback_status, api_response);
}

async function GetUpdateCallbackAttempt(id, attemptcount) {
    return await _Callback.SetUpdateCallbackAttempt(id, attemptcount);
}


async function ElasticEmailAccount(country_code) {
    const res = await _AcctProviders.SetElasticEmailAccount(PROVIDER_ELASTIC_EMAIL, country_code);
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
async function GetElasticSendingCallback(api_response, country) {
    const _json_parse = JSON.parse(api_response);
    const parse_transacID = String(_json_parse.data.transactionid);

    const apikey = await ElasticEmailAccount(country);


    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/getstatus?apikey=${apikey.apikey}&transactionID=${parse_transacID}&showFailed=true&showSent=true&showDelivered=true&showPending=true&showOpened=true&showClicked=true&showAbuse=true&showUnsubscribed=true&showErrors=true&showMessageIDs=true`,
            headers: {}
        };

        axios.request(config)
            .then((response) => {
                if (response.data.data.deliveredcount !== 0) {
                    const __json = new Object();
                    __json.id = response.data.data.id;
                    __json.status = 'Sent';
                    __json.to = response.data.data.delivered;
                    const apiResponse = JSON.stringify(__json);
                    resolve(apiResponse);
                } else if (response.data.data.failedcount !== 0) {
                    const __json = new Object();
                    __json.id = response.data.data.id;
                    __json.status = 'Failed';
                    __json.error_message = response.data.data.failed;
                    const apiResponse = JSON.stringify(__json);
                    reject(apiResponse);
                } else if (response.data.data.pendingcount !== 0) {
                    const __json = new Object();
                    __json.id = response.data.data.id;
                    __json.status = 'Throttled';
                    __json.message = 'Waiting to retry';
                    const apiResponse = JSON.stringify(__json);
                    resolve(apiResponse);
                }
            }).catch((error) => { });

    });

}


async function SpinWheelCallback(url, payload) {
    let result = url;
    const JsonPayload = JSON.parse(payload);
    const _response = encodeURIComponent(JsonPayload.response);
    const _status = encodeURIComponent(JsonPayload.status);
    if (result.indexOf('http://') > -1) {
        result = url.replace("http://", "https://");
    }

    const _url = result += `?status=${_status}&msg=${_response}`;


    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            url: _url,
            headers: {}
        };

        axios.request(config)
            .then((response) => {
                resolve(JSON.stringify(response.data));
            })
            .catch((error) => {
                reject(error);
            });
    });

}
module.exports = function () {
    this.GetCallbackItems = GetCallbackItems;
    this.GetElasticSendingCallback = GetElasticSendingCallback;
    this.GetUpdateCallback = GetUpdateCallback;
    this.SpinWheelCallback = SpinWheelCallback;
    this.GetUpdateCallbackAttempt = GetUpdateCallbackAttempt;

}


