const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetSmartSMSAccount(app_id, country_code, environment) {
    return await _AcctProviders.SetSmartSMSAccount(app_id, country_code, environment);
}

module.exports = function () {
    this.GetSmartSMSAccount = GetSmartSMSAccount;
}