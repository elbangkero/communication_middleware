const { local_connection } = require('../utils/db_connection');


async function AntsUpdateCallback(bulkid) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_callback set callback_status = 'Received' , attemptcount = '1' where api_response='${bulkid}'`, (err, res) => {
            err ? reject(`AntsUpdateCallback[Error]: ${err.message}`) : resolve(res);
        });
    });
}

function CallbackTimeStatus() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

    return timestamp;
}





CallBackStatus = async (_req, _res) => {
    _res.status(200).json({ 'statusCode': 200, message: 'Callback update status succesfully', 'data': [_req.query, { "timestamp": CallbackTimeStatus() }] });
    console_log(JSON.stringify({ 'statusCode': 200, message: 'Callback update status succesfully', 'data': [_req.query, { "timestamp": CallbackTimeStatus() }] }));
    await AntsUpdateCallback(_req.query.bulkId);
};

module.exports = function (app) {
    app.get('/callback', CallBackStatus);

};