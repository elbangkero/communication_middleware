
const { local_connection } = require('../../../utils/db_connection');

async function SetCallback(history_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_callback(history_id, callback_status, api_response,attemptCount) VALUES('${history_id}', 'Pending', '',0)`, (err, res) => {
            err ? reject(`SetCallback[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetCallbackSMSAnts(history_id, Callback) {
    function extractBulkId(url) {
        const questionMarkIndex = url.indexOf('?');
        if (questionMarkIndex !== -1) {
            const queryString = url.slice(questionMarkIndex + 1);

            const queryParams = queryString.split('&');

            for (let i = 0; i < queryParams.length; i++) {
                const param = queryParams[i].split('=');
                if (param[0] === 'bulkId') {
                    return param[1];
                }
            }
        }
        return null;
    }
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_callback(history_id, callback_status, api_response,attemptCount) VALUES('${history_id}', 'Pending', '${extractBulkId(Callback)}',0)`, (err, res) => {
            err ? reject(`SetCallbackSMSAnts[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetCallbackItems() {
    //console.log(`Status : ${status}`);
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select * from cmw_callback cc left join cmw_history ch on ch.history_id::varchar = cc.history_id where cc.callback_status IN('Pending','Throttled') and cc.attemptcount != 10 order by ch.history_id desc limit 1000`, (err, res) => {
            err ? reject(`SetCallbackItems[Error]: ${err.message}`) : resolve(res);
        })
    });
}

async function SetUpdateCallback(id, callback_status, api_response) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_callback set callback_status = '${callback_status}' , api_response = '${api_response}' where id=${id}`, (err, res) => {
            err ? reject(`SetUpdateCallback[Error]: ${err.message}`) : resolve(res);
        });
    });
}
async function SetUpdateCallbackAttempt(id, attemptcount) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_callback set attemptcount = '${attemptcount}' where id=${id}`, (err, res) => {
            err ? reject(`SetUpdateCallbackAttempt[Error]: ${err.message}`) : resolve(res);
        });
    });
}

module.exports = function () {
    this.SetCallback = SetCallback;
    this.SetCallbackSMSAnts = SetCallbackSMSAnts;
    this.SetCallbackItems = SetCallbackItems;
    this.SetUpdateCallback = SetUpdateCallback;
    this.SetUpdateCallbackAttempt = SetUpdateCallbackAttempt;

}