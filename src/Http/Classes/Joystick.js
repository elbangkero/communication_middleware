const axios = require('axios');

/*
async function SetUserInfoFromJoystick(player_token) {
    return new Promise(async (resolve, reject) => {
        joystick_connection.query(`select pdr.email,pdr.phone_number,pd.classificationcode,sc.brandcode ,pdr.country, pdr.firstname || ' ' || pdr.lastname AS playername from  afun_afun.player_data pd   
        left join afun_afun.player_data_revision pdr on pdr.playerid = pd.playerid 
        left join afun_afun.site_config sc on sc.siteid = pd.siteid 
        where pdr.dw_iscurrent = '1'
        and pd.playertoken ='${player_token}'`, async (err, res) => {
            err ? reject(`SetListenerPayload[Error]: ${err.message}`) : resolve(res);
        })
    });
}*/

async function SetUserInfoFromJoystick(token) {

    return new Promise(async (resolve, reject) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://afun-playerinfo-ap-prod.vitruviandata.com/player?token=${token}`,
            headers: {
                'Authorization': 'Basic bmltYnVzOndeN3FCUCpOJlRaZQ=='
            }
        };

        axios.request(config)
            .then((response) => {
                if (response.data.results.length === 0) {
                    reject('Invalid {PlayerToken}');
                } else {
                    resolve({
                        'email': response.data.results[0].profile.email,
                        'phone_number': response.data.results[0].profile.phoneNumber,
                        'classificationcode': response.data.results[0].tags,
                        'brandcode': response.data.results[0].info.siteCode,
                        'country': response.data.results[0].profile.country,
                        'playername': response.data.results[0].profile.firstName + ' ' + response.data.results[0].profile.lastName
                    });
                }

            })
            .catch((error) => {
                reject(error);
            });
    });

}


module.exports = function () {
    this.SetUserInfoFromJoystick = SetUserInfoFromJoystick;
}