const { local_connection } = require('../../utils/db_connection');
const axios = require('axios');
const cron = require('node-cron');

const base_url = `${process.env.API_BASE_URL}`;

function GetBulkCampaignList() {
    return new Promise((resolve, reject) => {
        local_connection.query(`SELECT 
            ch.config_id, 
            ch.campaign_name,
            TO_CHAR(ch.created_at::date, 'YYYY-MM-DD') as created_at
        FROM 
            cmw_history ch
        LEFT JOIN 
            cmw_campaign_report_trigger cmrt 
            ON cmrt.config_id::int = ch.config_id::int
        WHERE 
            cmrt.config_id IS NULL 
            OR cmrt.status NOT IN ('success','failed')
        GROUP BY 
            ch.config_id,ch.campaign_name,ch.created_at::date
        ORDER BY 
            ch.created_at::date DESC;`, (err, res) => {
            if (err) {
                reject(`GetBulkCampaignList[Error]: ${err.message}`);
            } else {
                resolve(res.rows || res);
            }
        });
    });
}

function GetBulkCampaignListNextRun() {
    return new Promise((resolve, reject) => {
        local_connection.query(` 
        select cmrt.config_id,TO_CHAR(cmrt.next_run::date, 'YYYY-MM-DD') as created_at,cc.campaign_name,count_run from cmw_campaign_report_trigger cmrt
            left join cmw_config cc on cc.config_id = cmrt.config_id
            where cmrt.next_run = NOW()::date
            and cmrt.status = 'success'
            and cmrt.count_run < 5;
 
            `, (err, res) => {
            if (err) {
                reject(`GetBulkCampaignListNextRun[Error]: ${err.message}`);
            } else {
                resolve(res.rows || res);
            }
        });
    });
}


async function InsertCampaignTrigger(config_id, sent_at, status, next_run, count_run) {
    const nextRunValue = status === 'success' ? `'${next_run}'` : null;
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_campaign_report_trigger (config_id, sent_at, created_at, status, next_run, count_run) VALUES (${config_id}, '${sent_at}', CURRENT_TIMESTAMP, '${status}',${nextRunValue},${count_run});`, (err, res) => {
            err ? reject(`InsertCampaignTrigger[Error]: ${err.message}`) : resolve(res);
        });
    });
}


async function UPDATEcampaignTrigger(config_id, status, next_date_run, count_run) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`update cmw_campaign_report_trigger set count_run = '${count_run}' ,next_run='${next_date_run}',status='${status}' where config_id = '${config_id}'`, (err, res) => {
            err ? reject(`UPDATEcampaignTrigger[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function InsertCampaignHistory(config_id, campaign_name, recipients, email_total, sms_total, delivered, bounced, in_progress, opened, clicked, unsubscribed, complaints, inbound, manual_cancel, not_delivered) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`
INSERT INTO cmw_campaign_report_history
(config_id, campaign_name, recipients, email_total, sms_total, delivered, bounced, in_progress, opened, clicked, unsubscribed, complaints, inbound, manual_cancel, not_delivered)
VALUES(${config_id},'${campaign_name}', ${recipients}, ${email_total}, ${sms_total}, ${delivered},${bounced}, ${in_progress}, ${opened}, ${clicked}, ${unsubscribed}, ${complaints}, ${inbound}, ${manual_cancel}, ${not_delivered})
ON CONFLICT (config_id) 
DO UPDATE SET 
    campaign_name = '${campaign_name}',
    recipients = ${recipients}, 
    email_total = ${email_total}, 
    sms_total = ${sms_total}, 
    delivered = ${delivered}, 
    bounced = ${bounced}, 
    in_progress = ${in_progress}, 
    opened = ${opened}, 
    clicked = ${clicked}, 
    unsubscribed = ${unsubscribed}, 
    complaints = ${complaints}, 
    inbound = ${inbound}, 
    manual_cancel = ${manual_cancel}, 
    not_delivered = ${not_delivered}`, (err, res) => {
            err ? reject(`InsertCampaignHistory[Error]: ${err.message}`) : resolve(res);
        });
    });
}


function PlusSevenDays(formattedDate) {
    const date = new Date(formattedDate);

    date.setDate(date.getDate() + 7);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const newDate = `${year}-${month}-${day}`;
    return newDate;

}

function GetReport() {
    GetBulkCampaignList()
        .then(result => {
            result.forEach(async item => {
                const formattedDate = item.created_at;

                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${base_url}/elastic_report/${item.config_id}`,
                };

                await axios.request(config)
                    .then(async (response) => {
                        const status = response.status === 200 ? 'success' : 'failed';
                        const convertedDate = new Date(formattedDate);
                        const next_date_run = PlusSevenDays(convertedDate);

                        await InsertCampaignTrigger(item.config_id, formattedDate, status, next_date_run, 1);
                        if (response.status === 200) {
                            await InsertCampaignHistory(item.config_id, item.campaign_name, response.data.Recipients, response.data.EmailTotal,
                                response.data.SmsTotal, response.data.Delivered, response.data.Bounced, response.data.InProgress,
                                response.data.Opened, response.data.Clicked, response.data.Unsubscribed,
                                response.data.Complaints, response.data.Inbound, response.data.ManualCancel, response.data.NotDelivered);
                        }
                    })
                    .catch(async (error) => {
                        await InsertCampaignTrigger(item.config_id, formattedDate, 'failed', null, 0);
                    });
            });
        })
        .catch(error => {
            console.error(`Error in GetBulkCampaignList: ${error}`);
        });
}


function NextRunReport() {
    GetBulkCampaignListNextRun()
        .then(result => {
            result.forEach(async item => {
                const formattedDate = item.created_at;

                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `${base_url}/elastic_report/${item.config_id}`,
                };


                await axios.request(config)
                    .then(async (response) => {
                        const status = response.status === 200 ? 'success' : 'failed';
                        const convertedDate = new Date(formattedDate);
                        const next_date_run = PlusSevenDays(convertedDate);

                        await UPDATEcampaignTrigger(item.config_id, status, next_date_run, item.count_run + 1);
                        if (response.status === 200) {
                            await InsertCampaignHistory(item.config_id, item.campaign_name, response.data.Recipients, response.data.EmailTotal,
                                response.data.SmsTotal, response.data.Delivered, response.data.Bounced, response.data.InProgress,
                                response.data.Opened, response.data.Clicked, response.data.Unsubscribed,
                                response.data.Complaints, response.data.Inbound, response.data.ManualCancel, response.data.NotDelivered);
                        }
                    })
                    .catch(async (error) => {
                        await UPDATEcampaignTrigger(item.config_id, 'failed', next_date_run, item.count_run);
                    });
            });
        })
        .catch(error => {
            console.error(`Error in GetBulkCampaignListNextRun: ${error}`);
        });
}

cron.schedule('0 0 * * *', () => {
    GetReport();
    NextRunReport();
});
GetReport();
NextRunReport();