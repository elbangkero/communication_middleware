const AcctProviders = require('../../Classes/AcctProviders');
const _AcctProviders = new AcctProviders();


async function GetElasticEmailAccount(app_id) {
    return await _AcctProviders.SetElasticEmailAccount(app_id);
}

async function GetElasticEmailAccountSegregation(app_id, country_code) {
    return await _AcctProviders.SetElasticEmailAccountSegregation(app_id, country_code);
}

module.exports = function () {
    this.GetElasticEmailAccount = GetElasticEmailAccount;
    this.GetElasticEmailAccountSegregation = GetElasticEmailAccountSegregation;
}