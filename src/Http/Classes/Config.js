
const { local_connection, joystick_connection } = require('../../../utils/db_connection');

async function SetListenerPayload() {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`SELECT * FROM cmw_config where triggerstatus='active' and sending ='true' and status !='sending'`, (err, res) => {
            err ? reject(`Connection[Error]: ${err.message}`) : resolve(res);
        })
    });

}
async function SetUpdateConfigSending(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set status= 'sending' where config_id=${config_id}`, (err, res) => {
            err ? reject(`Update Config[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetUpdateConfigSent(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
            err ? reject(`Update Config Sent[Error]: ${err.message}`) : resolve(res);
        });
    });
}


module.exports = function () {
    this.SetListenerPayload = SetListenerPayload;
    this.SetUpdateConfigSending = SetUpdateConfigSending;
    this.SetUpdateConfigSent = SetUpdateConfigSent;

}