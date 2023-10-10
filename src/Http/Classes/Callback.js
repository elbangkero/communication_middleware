
const { local_connection } = require('../../../utils/db_connection');

async function SetCallback(history_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_callback(history_id, callback_status, api_response) VALUES('${history_id}', 'Pending', '')`, (err, res) => {
            err ? reject(`SetCallback[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetCallbackItems() {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select * from cmw_callback cc left join cmw_history ch on ch.history_id::varchar = cc.history_id where cc.callback_status = 'Pending' order by ch.history_id desc`, (err, res) => {
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

module.exports = function () {
    this.SetCallback = SetCallback;
    this.SetCallbackItems = SetCallbackItems;
    this.SetUpdateCallback = SetUpdateCallback;
}