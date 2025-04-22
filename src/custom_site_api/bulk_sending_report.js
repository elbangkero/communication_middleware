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

async function InsertCampaignTrigger(config_id, sent_at, status) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`
INSERT INTO cmw_campaign_report_trigger
(config_id, sent_at, created_at, status)
VALUES(${config_id}, '${sent_at}', CURRENT_TIMESTAMP, '${status}');`, (err, res) => {
            err ? reject(`InsertCampaignTrigger[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function InsertCampaignHistory(config_id, campaign_name, recipients, email_total, sms_total, delivered, bounced, in_progress, opened, clicked, unsubscribed, complaints, inbound, manual_cancel, not_delivered) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`
INSERT INTO cmw_campaign_report_history
(config_id, campaign_name, recipients, email_total, sms_total, delivered, bounced, in_progress, opened, clicked, unsubscribed, complaints, inbound, manual_cancel, not_delivered)
VALUES(${config_id},'${campaign_name}', ${recipients}, ${email_total}, ${sms_total}, ${delivered},${bounced}, ${in_progress}, ${opened}, ${clicked}, ${unsubscribed}, ${complaints}, ${inbound}, ${manual_cancel}, ${not_delivered});`, (err, res) => {
            err ? reject(`InsertCampaignTrigger[Error]: ${err.message}`) : resolve(res);
        });
    });
}

function GetReport() {
    GetBulkCampaignList()
        .then(result => {
            console.log(`Found ${result.length} campaigns to process`);
            
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
                        await InsertCampaignTrigger(item.config_id, formattedDate, status); 
                        if (response.status === 200) { 
                            await InsertCampaignHistory(item.config_id, item.campaign_name, response.data.Recipients, response.data.EmailTotal,
                                response.data.SmsTotal, response.data.Delivered, response.data.Bounced, response.data.InProgress,
                                response.data.Opened, response.data.Clicked, response.data.Unsubscribed,
                                response.data.Complaints, response.data.Inbound, response.data.ManualCancel, response.data.NotDelivered);
                        }
                    })
                    .catch(async (error) => {
                        await InsertCampaignTrigger(item.config_id, formattedDate, 'failed');
                    });
            });
        })
        .catch(error => {
            console.error(`Error in GetBulkCampaignList: ${error}`);
        });
}

cron.schedule('0 0 * * *', () => {
    GetReport();
});