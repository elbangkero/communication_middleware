const SiteConfig = require('../Classes/SiteConfig');
const _SiteConfig = new SiteConfig();
const Brands = require('../Classes/Brands');
const _Brands = new Brands();
const History = require('../Classes/History');
const _History = new History();

async function GetValidateSiteID(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    const data = result.rows;
    return data.length === 0 ? false : true;
}
async function GetSiteName(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    return result.rows;
}
async function GetStoreMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, brandcode) {
    const res = await _Brands.setBrands(brandcode);
    const brand_id = res.rows[0].brand_id;
    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    await _History.setMessageHistory(config_id, campaign_name, player_token, player_contact, platform, country, message, status, api_response, from, email_subject, template_id, application_id, merge, local_time, brand_id);

}

module.exports = function () {
    this.GetValidateSiteID = GetValidateSiteID;
    this.GetSiteName = GetSiteName;
    this.GetStoreMessageHistory = GetStoreMessageHistory;
}