const SiteConfig = require('../Classes/SiteConfig');
const _SiteConfig = new SiteConfig();
const Brands = require('../Classes/Brands');
const _Brands = new Brands();
const History = require('../Classes/History');
const _History = new History();
const Config = require('../Classes/Config');
const _Config = new Config();
const Providers = require('../Classes/Providers');
const _Providers = new Providers();
const AcctProviders = require('../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();
const Joystick = require('../Classes/Joystick');
const _Joystick = new Joystick();
const Callback = require('../Classes/Callback');
const _Callback = new Callback();

async function GetValidateSiteID(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    const data = result.rows;
    return data.length === 0 ? false : true;
}
async function GetSiteName(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    return result.rows;
}
async function GetStoreMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, brandcode, callback_url) {
    const res = await _Brands.setBrands(brandcode);
    const brand_id = res.rowCount != 0 ? res.rows[0].brand_id : 1;
    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const Callback = callback_url !== undefined ? callback_url : '';
    await _History.setMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, local_time, brand_id, Callback)
        .then(async result => {
            if (result.rows[0].status === 'success') {
                if (application_id == 'ANTS_SMS') {
                    const history_id = result.rows[0].history_id;
                    await _Callback.SetCallbackSMSAnts(history_id, Callback);
                } else {
                    const history_id = result.rows[0].history_id;
                    await _Callback.SetCallback(history_id);
                }

            }

        })
        .catch(error => {
            console.error(error);
        });

}
async function GetListenerPayload() {
    return await _Config.SetListenerPayload();
}
async function GetUpdateConfigSending(config_id) {
    return await _Config.SetUpdateConfigSending(config_id);
}
async function GetUpdateConfigSent(config_id) {
    return await _Config.SetUpdateConfigSent(config_id);
}
async function GetUpdateConfigError(config_id) {
    return await _Config.SetUpdateConfigError(config_id);
}
async function GetProviders(application_id) {
    return await _Providers.SetProviders(application_id);
}
async function GetInsertConfig(local_time, parseISO, sending, data_source, campaign_name, data_leads, is_scheduled, site_id, created_by) {
    return await _Config.SetInsertConfig(local_time, parseISO, sending, data_source, campaign_name, data_leads, is_scheduled, site_id, created_by);
}
async function GetInsertProviders(provider_name, application_id, _platform, platform, endpoint, local_time) {
    return await _Providers.SetInsertProviders(provider_name, application_id, _platform, platform, endpoint, local_time);
}
async function GetInsertAcctProviders(country_code, provider_code, username, password, apikey, md5key, rand, orgCode, local_time) {
    return await _AcctProviders.SetInsertAcctProviders(country_code, provider_code, username, password, apikey, md5key, rand, orgCode, local_time);
}
async function GetStopScheduled(id) {
    return await _Config.SetStopScheduled(id);
}
async function GetStopTrigger(id) {
    return await _Config.SetStopTrigger(id);
}
async function GetUserInfoFromJoystick(player_token) {
    return await _Joystick.SetUserInfoFromJoystick(player_token);
}
async function GetStopTriggerStatus(id) {
    return await _Config.SetStopTriggerStatus(id);
}
module.exports = function () {
    this.GetValidateSiteID = GetValidateSiteID;
    this.GetSiteName = GetSiteName;
    this.GetStoreMessageHistory = GetStoreMessageHistory;
    this.GetListenerPayload = GetListenerPayload;
    this.GetUpdateConfigSending = GetUpdateConfigSending;
    this.GetUpdateConfigSent = GetUpdateConfigSent;
    this.GetProviders = GetProviders;
    this.GetInsertConfig = GetInsertConfig;
    this.GetInsertProviders = GetInsertProviders;
    this.GetInsertAcctProviders = GetInsertAcctProviders;
    this.GetStopScheduled = GetStopScheduled;
    this.GetUserInfoFromJoystick = GetUserInfoFromJoystick;
    this.GetUpdateConfigError = GetUpdateConfigError;
    this.GetStopTrigger = GetStopTrigger;
    this.GetStopTriggerStatus = GetStopTriggerStatus;
}