
const { local_connection, joystick_connection } = require('../../../utils/db_connection');


async function SetInsertAcctProviders(country_code, provider_code, username, password, apikey, md5key, rand, orgCode, local_time) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_acct_providers (country_code,provider_code,username,password,apikey,md5Key,rand,orgCode,created_at,updated_at) VALUES ('${country_code}','${provider_code}','${username}','${password}','${apikey}','${md5key}','${rand}','${orgCode}','${local_time}','${local_time}')`, (err, res) => {
            err ? reject(`SetInsertAcctProviders[Error]: ${err.message}`) : resolve(res);
        });
    });
}

module.exports = function () {
    this.SetInsertAcctProviders = SetInsertAcctProviders;

}