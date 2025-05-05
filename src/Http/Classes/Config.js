
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
        local_connection.query(`update cmw_config set status= 'sending' ,  updated_at = CURRENT_TIMESTAMP  where config_id=${config_id}`, (err, res) => {
            err ? reject(`SetUpdateConfigSendingError]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetUpdateConfigSent(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'sent' ,  updated_at = CURRENT_TIMESTAMP  where config_id=${config_id}`, (err, res) => {
            err ? reject(`SetUpdateConfigSent[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetUpdateConfigError(config_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set triggerstatus= 'inactive' , status = 'error' ,  updated_at = CURRENT_TIMESTAMP  where config_id=${config_id}`, (err, res) => {
            err ? reject(`SetUpdateConfigError[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetInsertConfig(local_time, parseISO, sending, data_source, campaign_name, data_leads, is_scheduled, site_id, created_by, category_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_config(status,triggerstatus,created_at,updated_at,start_at,sending,data_source,campaign_name,data_leads,is_scheduled,site_id,created_by,category_id) VALUES ('pending','active','${local_time}','${local_time}','${parseISO}','${sending}','${data_source}','${campaign_name}','${data_leads}','${is_scheduled}','${site_id}','${created_by}','${category_id}')`, (err, res) => {
            err ? reject(`SetInsertConfig[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetStopScheduled(id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set status= 'cancelled' , triggerstatus='inactive' ,  sending = false ,  updated_at = CURRENT_TIMESTAMP  where config_id='${id}'`, (err, res) => {
            err ? reject(`SetStopScheduled[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetStopTrigger(id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_config set status= 'cancelled', triggerstatus='inactive' , sending = false , updated_at = CURRENT_TIMESTAMP where config_id='${id}'`, (err, res) => {
            err ? reject(`SetStopTrigger[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetStopTriggerStatus(id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`SELECT sending FROM cmw_config where config_id ='${id}'`, (err, res) => {
            err ? reject(`SetStopTriggerStatus[Error]: ${err.message}`) : resolve(res);
        })
    });

}

async function SetCampaignCategory(category_name) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(` select id from cmw_campaign_category where category_name = '${category_name}' limit 1;`, (err, res) => {
            err ? reject(`SetCampaignCategory[Error]: ${err.message}`) : resolve(res);
        })
    });

}

async function SetInsertCampaignCategory(category_name, created_by) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO cmw_campaign_category (category_name, created_at, created_by)
            VALUES ($1, NOW(), $2)
            ON CONFLICT (category_name) 
            DO UPDATE SET 
                category_name = $1,
                created_at = NOW()
            RETURNING id;
        `;
        local_connection.query(sql, [category_name, created_by], (err, res) => {
            if (err) {
                reject(`SetInsertCampaignCategory[Error]: ${err.message}`);
            } else {
                resolve(res.rows[0].id);
            }
        });
    });
}

module.exports = function () {
    this.SetListenerPayload = SetListenerPayload;
    this.SetUpdateConfigSending = SetUpdateConfigSending;
    this.SetUpdateConfigSent = SetUpdateConfigSent;
    this.SetInsertConfig = SetInsertConfig;
    this.SetStopScheduled = SetStopScheduled;
    this.SetUpdateConfigError = SetUpdateConfigError;
    this.SetStopTrigger = SetStopTrigger;
    this.SetStopTriggerStatus = SetStopTriggerStatus;
    this.SetCampaignCategory = SetCampaignCategory;
    this.SetInsertCampaignCategory = SetInsertCampaignCategory;


}