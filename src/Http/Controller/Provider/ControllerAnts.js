const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();

async function GetAntsAccount(app_id, country_code) {
    return await _AcctProviders.SetAntsAccount(app_id, country_code);
}

module.exports = function () {
    this.GetAntsAccount = GetAntsAccount;
}