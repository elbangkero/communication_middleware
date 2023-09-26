const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();



async function GetAbenlaAccount(country_code, vip_classification) {
    return await _AcctProviders.SetAbenlaAccount(country_code, vip_classification);
}
module.exports = function () {
    this.GetAbenlaAccount = GetAbenlaAccount;
}