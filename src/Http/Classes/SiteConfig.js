
const { local_connection } = require('../../../utils/db_connection');
 
async function setConfig(site_id) {
    return res = await local_connection.query(`SELECT sitename FROM cmw_site_config where site_id::varchar(255) = '${site_id}' LIMIT 1`);
}


module.exports = function () {
    this.setConfig = setConfig;
}