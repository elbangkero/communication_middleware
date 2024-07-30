const { hv_connection } = require('../../../utils/db_connection');

async function SetUserInfoFromZgaming(player_token) {
    return new Promise(async (resolve, reject) => {
        hv_connection.query(`select email,CONCAT('+66', RIGHT(CAST(phone AS CHAR), 9)) AS phone_number,"[ 'Regular' ]" as classificationcode,'HAPPYVEGAS_COM' as brandcode,'TH' as country,
CONCAT(first_name , ' ',last_name) as playername 
FROM user where username = '${player_token}';`, (err, res) => {
            if (res.length === 0) {
                const errorResponse =
                {
                    success: false,
                    error: 'Invalid Username',
                    errordata: player_token
                };
                reject(errorResponse);
            } else {
                resolve(JSON.parse(JSON.stringify(res[0])));
            }

        })
    });
}




module.exports = function () {
    this.SetUserInfoFromZgaming = SetUserInfoFromZgaming;
}