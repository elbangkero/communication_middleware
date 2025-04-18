
const { local_connection } = require('../../../utils/db_connection');


async function SetInsertAcctProviders(country_code, provider_code, username, password, apikey, md5key, rand, orgCode, local_time) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_acct_providers (country_code,provider_code,username,password,apikey,md5Key,rand,orgCode,created_at,updated_at) VALUES ('${country_code}','${provider_code}','${username}','${password}','${apikey}','${md5key}','${rand}','${orgCode}','${local_time}','${local_time}')`, (err, res) => {
            err ? reject(`SetInsertAcctProviders[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetAbenlaAccount(country_code, vip_classification) {
    return res = await local_connection.query(`SELECT username, md5key, endpoint FROM cmw_acct_providers cap
    left join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${process.env.PROVIDER_ABENLA_SMS}' and cap.country_code = '${country_code}' and rand = '${vip_classification}' LIMIT 1`);
}

async function SetAbosendAccount(app_id) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' ORDER BY random() LIMIT 1`);
}

async function SetElasticEmailAccountSegregation(app_id, country_code) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}'  and country_code like '${country_code}' LIMIT 1`);
}
async function SetElasticEmailAccount(app_id) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' LIMIT 1`);
}

async function SetSmartSMSAccount(app_id, country_code, environment) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' and country_code = '${country_code}' and environment = '${environment}' LIMIT 1`);
}

async function SetTextLocalAccount(app_id, environment) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' LIMIT 1`);
}

async function SetAntsAccount(app_id, country_code) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' and country_code = '${country_code}' LIMIT 1`);
}

async function SetLaafficAccount(app_id, country_code) {
    return res = await local_connection.query(`SELECT cap.apikey,cap.md5key,cp.endpoint,cap.rand  FROM cmw_acct_providers cap left join cmw_providers cp on cp.provider_code = cap.provider_code where cap.provider_code = '${app_id}' and cap.country_code = '${country_code}'  LIMIT 1`);
}

async function SetElasticEmailCallback(application_id, country_code) {
    const email_type = application_id == 'EMAIL_EE' ? `and cp.application_id  = 'EMAIL_EE' and cap.country_code = '${country_code}'` : `and cp.application_id  = '${application_id}'`;
    return res = await local_connection.query(`    SELECT  cap.country_code,cap.apikey,cp.provider_code,cp.provider_name  FROM cmw_acct_providers cap
    left join cmw_providers cp on cp.provider_code  = cap.provider_code
    where cp.provider_name = 'Elastic Email' AND cp.platform = 'email'
    ${email_type}
    group by cap.country_code,cap.apikey,cp.provider_code,cp.provider_name;`);

}


async function SetSMSMKTAccount(app_id, country_code) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}' and country_code = '${country_code}' LIMIT 1`);
}

async function SetElasticEmailBulk(app_id) {
    return res = await local_connection.query(`
            select cap.apikey from cmw_acct_providers cap 
            left join cmw_providers cp on cp.provider_code = cap.provider_code 
            where cp.application_id = '${app_id}'
            limit 1;
            `);
}

async function SetElasticEmailApiKey(config_id) {
    return res = await local_connection.query(`
        select cap.apikey from cmw_history ch 
        left join cmw_providers cp on cp.application_id = ch.application_id
        left join cmw_acct_providers cap on cp.provider_code = cap.provider_code
        where  ch.config_id = '${config_id}' and  ch.platform = 'email' 
        group by  cap.apikey;
            `);
}

module.exports = function () {
    this.SetInsertAcctProviders = SetInsertAcctProviders;
    this.SetAbenlaAccount = SetAbenlaAccount;
    this.SetAbosendAccount = SetAbosendAccount;
    this.SetElasticEmailAccount = SetElasticEmailAccount;
    this.SetSmartSMSAccount = SetSmartSMSAccount;
    this.SetTextLocalAccount = SetTextLocalAccount;
    this.SetElasticEmailAccountSegregation = SetElasticEmailAccountSegregation;
    this.SetAntsAccount = SetAntsAccount;
    this.SetElasticEmailCallback = SetElasticEmailCallback;
    this.SetSMSMKTAccount = SetSMSMKTAccount;
    this.SetLaafficAccount = SetLaafficAccount;
    this.SetElasticEmailBulk = SetElasticEmailBulk;
    this.SetElasticEmailApiKey = SetElasticEmailApiKey;

}