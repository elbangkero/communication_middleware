
const { local_connection } = require('../../../utils/db_connection');

async function setBrands(brandcode) {
    return res = await local_connection.query(`select brand_id from cmw_brands cb where unique_sitecode = '${brandcode}' limit 1; `);
}


module.exports = function () {
    this.setBrands = setBrands;
}