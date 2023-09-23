
const { local_connection, joystick_connection } = require('../../../utils/db_connection');

async function SetProviders(application_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`SELECT * FROM cmw_providers where application_id = '${application_id}'`, (err, res) => {
            err ? reject(err) : resolve(res);
        })
    });

}

module.exports = function () {
    this.SetProviders = SetProviders;

}