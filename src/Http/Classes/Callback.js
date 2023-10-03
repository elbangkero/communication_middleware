
const { local_connection } = require('../../../utils/db_connection');

async function SetCallback(history_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_callback(history_id, status, api_response) VALUES('${history_id}', 'pending', '')`, (err, res) => {
            err ? reject(`setMessageHistory[Error]: ${err.message}`) : resolve(res);
        });
    });
}


module.exports = function () {
    this.SetCallback = SetCallback;
}