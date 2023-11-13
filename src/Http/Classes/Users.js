
const { local_connection } = require('../../../utils/db_connection');

async function SetUserSiteID(token, site_id) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select * from cmw_site_config csc 
        left join users u ON u.site_id::int = csc.site_id
        where u.token = '${token}'
        and csc.site_id = '${site_id}';`, (err, res) => {
            err ? reject(`SetUserSiteID[Error]: ${err.message}`) : resolve(res);
        });
    });
}

async function SetLocalToken(token) {
    return new Promise(async (resolve, reject) => {
        local_connection.query(`select * from users where token = '${token}'`, (err, res) => {
            err ? reject(`SetLocalToken[Error]: ${err.message}`) : resolve(res);
        });
    });
}


module.exports = function () {
    this.SetUserSiteID = SetUserSiteID;
    this.SetLocalToken = SetLocalToken;
}