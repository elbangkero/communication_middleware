
const { local_connection } = require('../../../utils/db_connection');

async function SetListenerPayload() {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`SELECT * FROM cmw_config where triggerstatus='active' and sending ='true' and status !='sending'`, (err, res) => {
            err ? reject(`SetListenerPayload[Error]: ${err.message}`) : resolve(res);
        })
    });

}
async function SetUpdateConfigSending(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set status= 'sending' where config_id=${config_id}`, (err, res) => {
            err ? reject(`SetUpdateConfigSendingError]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetUpdateConfigSent(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' where config_id=${config_id}`, (err, res) => {
            err ? reject(`SetUpdateConfigSent[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetInsertConfig(local_time, parseISO, sending, data_source, campaign_name, data_leads, is_scheduled, site_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_config(status,triggerstatus,created_at,updated_at,start_at,sending,data_source,campaign_name,data_leads,is_scheduled,site_id) VALUES ('pending','active','${local_time}','${local_time}','${parseISO}','${sending}','${data_source}','${campaign_name}','${data_leads}','${is_scheduled}','${site_id}')`, (err, res) => {
            err ? reject(`SetInsertConfig[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetStopScheduled(id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set status= 'cancelled', is_scheduled = 'false' , triggerstatus='inactive' where config_id='${id}'`, (err, res) => {
            err ? reject(`SetStopScheduled[Error]: ${err.message}`) : resolve(res);
        });
    });
}


module.exports = function () {
    this.SetListenerPayload = SetListenerPayload;
    this.SetUpdateConfigSending = SetUpdateConfigSending;
    this.SetUpdateConfigSent = SetUpdateConfigSent;
    this.SetInsertConfig = SetInsertConfig;
    this.SetStopScheduled = SetStopScheduled;

}