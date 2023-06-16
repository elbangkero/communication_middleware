

const nimbus = require('../views/nimbus_view.js');

module.exports = function (app) {
 
    app.get('/providers', nimbus.API_Providers);
    app.get('/acct-providers', nimbus.API_Account_Providers);
    app.get('/api_history', nimbus.API_DisplayHistory);
    app.get('/api_triggers', nimbus.API_DisplayTriggers);
};