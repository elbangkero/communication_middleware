const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetLaafficAccount(app_id, country_code) {
    return await _AcctProviders.SetLaafficAccount(app_id, country_code);
}

module.exports = function () {
    this.GetLaafficAccount = GetLaafficAccount;
}