const SiteConfig = require('../Classes/SiteConfig');
const _SiteConfig = new SiteConfig();
const Brands = require('../Classes/Brands');
const _Brands = new Brands();

async function GetValidateSiteID(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    const data = result.rows;
    return data.length === 0 ? false : true;
}
async function GetSiteName(site_id) {
    const result = await _SiteConfig.setConfig(site_id);
    return result.rows;
}
async function GetBrandID(brandcode) {
    return result = await _Brands.setBrands(brandcode);
}


module.exports = function () {
    this.GetValidateSiteID = GetValidateSiteID;
    this.GetSiteName = GetSiteName;
    this.GetBrandID = GetBrandID;
}