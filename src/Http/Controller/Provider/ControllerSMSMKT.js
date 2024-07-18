const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetSMSMKTAccount(app_id, country_code) {
    return await _AcctProviders.SetSMSMKTAccount(app_id, country_code);
}


module.exports = function () {
    this.GetSMSMKTAccount = GetSMSMKTAccount;
}