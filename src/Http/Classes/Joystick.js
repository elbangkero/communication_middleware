
const { joystick_connection } = require('../../../utils/db_connection');

async function SetUserInfoFromJoystick(player_token) {
    return new Promise(async (resolve, reject) => {
        joystick_connection.query(`select pdr.email,pdr.phone_number,pd.classificationcode,sc.brandcode ,pdr.country from  afun_afun.player_data pd   
        left join afun_afun.player_data_revision pdr on pdr.playerid = pd.playerid 
        left join afun_afun.site_config sc on sc.siteid = pd.siteid 
        where pdr.dw_iscurrent = '1'
        and pd.playertoken ='${player_token}'`, async (err, res) => {
            err ? reject(`SetListenerPayload[Error]: ${err.message}`) : resolve(res);
        })
    });
}


module.exports = function () {
    this.SetUserInfoFromJoystick = SetUserInfoFromJoystick;
}