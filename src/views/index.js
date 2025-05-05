

const nimbus = require('../views/nimbus_view.js');
const elastic_nimbus_report = require('../views/report_proxyAPI.js');

module.exports = function (app) {

    app.get('/providers', nimbus.API_Providers);
    app.get('/acct-providers', nimbus.API_Account_Providers);
    app.get('/api_history', nimbus.API_DisplayHistory);
    app.get('/api_triggers', nimbus.API_DisplayTriggers);
    app.get('/api_history/view-history/:id', nimbus.API_ViewHistory);
    app.get('/sending/status/:config_id', nimbus.Sendouts_Status);
    app.get('/elastic_report/:config_id', elastic_nimbus_report.getElasticReport);
    app.get('/campaign_category', nimbus.campaign_category);

};