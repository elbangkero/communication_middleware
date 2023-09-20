
const { local_connection, joystick_connection } = require('../../../utils/db_connection');

async function setBrands(brandcode) {
    return res = await local_connection.query(`select brand_id from cmw_brands cb where brandcode = '${brandcode}' limit 1; `);
}


module.exports = function () {
    this.setBrands = setBrands;
}