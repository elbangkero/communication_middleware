const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();



async function GetAbenlaAccount(app_id,country_code, vip_classification) {
    return await _AcctProviders.SetAbenlaAccount(app_id,country_code, vip_classification);
}
module.exports = function () {
    this.GetAbenlaAccount = GetAbenlaAccount;
}