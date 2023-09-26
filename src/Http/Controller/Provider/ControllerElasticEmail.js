const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetElasticEmailAccount(app_id, country_code) {
    return await _AcctProviders.SetElasticEmailAccount(app_id, country_code);
}

module.exports = function () {
    this.GetElasticEmailAccount = GetElasticEmailAccount;
}