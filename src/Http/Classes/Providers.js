
const { local_connection, joystick_connection } = require('../../../utils/db_connection');

async function SetProviders(application_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`SELECT * FROM cmw_providers where application_id = '${application_id}'`, (err, res) => {
            err ? reject(err) : resolve(res);
        })
    });

}

async function SetInsertProviders(provider_name, application_id, _platform, platform, endpoint, local_time) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_providers (provider_name,application_id,provider_code,platform,endpoint,created_at,updated_at) VALUES ('${provider_name}','${application_id}',(SELECT concat('${_platform}', MAX(provider_id)+1) FROM cmw_providers),'${platform}','${endpoint}','${local_time}','${local_time}')`, (err, res) => {
            err ? reject(`SetInsertProviders[Error]: ${err.message}`) : resolve(res);
        });
    });
}

module.exports = function () {
    this.SetProviders = SetProviders;
    this.SetInsertProviders = SetInsertProviders;

}