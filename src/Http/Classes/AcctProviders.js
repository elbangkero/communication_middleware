
const { local_connection } = require('../../../utils/db_connection');


async function SetInsertAcctProviders(country_code, provider_code, username, password, apikey, md5key, rand, orgCode, local_time) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`INSERT INTO cmw_acct_providers (country_code,provider_code,username,password,apikey,md5Key,rand,orgCode,created_at,updated_at) VALUES ('${country_code}','${provider_code}','${username}','${password}','${apikey}','${md5key}','${rand}','${orgCode}','${local_time}','${local_time}')`, (err, res) => {
            err ? reject(`SetInsertAcctProviders[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetAbenlaAccount(app_id,country_code, vip_classification) {
    return res = await local_connection.query(`SELECT  username, md5key, endpoint FROM cmw_acct_providers cap
    LEFT join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${app_id}' and cp.provider_id in ( SELECT unnest (string_to_array(provider_id , ',')::integer[]) as provider_id  from cmw_site_config csc 
    where site_id = (select site_id::int from users where token = '${process.env.TOKEN_HEADER_KEY}') order by site_id desc) and cap.country_code = '${country_code}' and rand = '${vip_classification}' LIMIT 1`);
}

async function SetAbosendAccount(app_id) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers cap
    LEFT join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${app_id}' and cp.provider_id in (SELECT unnest (string_to_array(provider_id , ',')::integer[]) as provider_id  from cmw_site_config csc 
    where site_id = (select site_id::int from users where token = '${process.env.TOKEN_HEADER_KEY}') order by site_id desc) 
    ORDER BY random() LIMIT 1`);
}

async function SetElasticEmailAccount(app_id, country_code) {
    console.log(app_id,country_code,process.env.TOKEN_HEADER_KEY)
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers cap
    LEFT join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${app_id}' and 
    cp.provider_id in ( SELECT unnest (string_to_array(provider_id , ',')::integer[]) as provider_id  from cmw_site_config csc 
    where site_id = (select site_id::int from users where token = '${process.env.TOKEN_HEADER_KEY}') order by site_id desc) 
    and country_code like '${country_code}' LIMIT 1`);
}

async function SetSmartSMSAccount(app_id, country_code, environment) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers cap
    LEFT join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${app_id}' and 
    cp.provider_id in ( SELECT unnest (string_to_array(provider_id , ',')::integer[]) as provider_id  from cmw_site_config csc 
    where site_id = (select site_id::int from users where token = '${process.env.TOKEN_HEADER_KEY}') order by site_id desc) 
    and country_code = '${country_code}' and environment = '${environment}' LIMIT 1`);
}

async function SetTextLocalAccount(app_id, environment) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers cap
    LEFT join cmw_providers cp on cp.provider_code = cap.provider_code 
    where cap.provider_code = '${app_id}' and 
    cp.provider_id in ( SELECT unnest (string_to_array(provider_id , ',')::integer[]) as provider_id  from cmw_site_config csc 
    where site_id = (select site_id::int from users where token = '${process.env.TOKEN_HEADER_KEY}') order by site_id desc)  LIMIT 1`);
}

async function SetElasticCronAccount(app_id, country_code) {
    return res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${app_id}'  and country_code like '${country_code}' LIMIT 1`);
}




module.exports = function () {
    this.SetInsertAcctProviders = SetInsertAcctProviders;
    this.SetAbenlaAccount = SetAbenlaAccount;
    this.SetAbosendAccount = SetAbosendAccount;
    this.SetElasticEmailAccount = SetElasticEmailAccount;
    this.SetSmartSMSAccount = SetSmartSMSAccount;
    this.SetTextLocalAccount = SetTextLocalAccount;
    this.SetElasticCronAccount = SetElasticCronAccount;
    
}