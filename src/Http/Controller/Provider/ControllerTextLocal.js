const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetTextLocalAccount(app_id) {
    return await _AcctProviders.SetTextLocalAccount(app_id);
}

module.exports = function () {
    this.GetTextLocalAccount = GetTextLocalAccount;
}