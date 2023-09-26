const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetAbosendAccount(app_id) {
    return await _AcctProviders.SetAbosendAccount(app_id);
}

module.exports = function () {
    this.GetAbosendAccount = GetAbosendAccount;
}