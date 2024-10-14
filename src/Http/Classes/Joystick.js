const axios = require('axios');
const interval = `${process.env.INTERVAL_TIME}`;
const https = require('https');
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

async function SetUserInfoFromJoystick(token, retries = 10) {

    return new Promise(async (resolve, reject) => {

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `http://172.31.11.15:2041/player-info?token=${token}`,
            headers: {},
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            })
        };

        const requestVitruvian = async (attempt) => {
            setTimeout(async () => {
                try {
                    const response = await axios(config);
                    if (response.data.data == 'Player does not exist') {
                        reject('Invalid {PlayerToken}');
                    } else {
                        resolve({
                            'email': response.data.data.profile.email,
                            'phone_number': response.data.data.profile.phoneNumber,
                            'classificationcode': response.data.data.tags,
                            'brandcode': response.data.data.info.siteCode,
                            'country': response.data.data.profile.country,
                            'playername': response.data.data.profile.firstName + ' ' + response.data.data.profile.lastName
                        });
                    }
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        reject('Request Timeout From Vitruvian');
                    }
                    else if (error.code === 'ERR_BAD_RESPONSE') {

                        if (attempt < retries) {
                            setTimeout(async function () {
                                console_log(`Retrying... Attempt on Token : ${token} Attempt : ${attempt + 1}`);
                                await requestVitruvian(attempt + 1);
                            }, attempt * 10000);
                        } else {
                            const errorResponse = {
                                data: {
                                    success: false,
                                    error: 'Vitruvian API Service Unavailable Exceeded 1 min Request',
                                    errordata: `${retries} attempts for this request have been exhausted`
                                }
                            };
                            reject(errorResponse);
                        }
                    } else {
                        reject(error);
                    }
                }
            }, interval);
        };
        await requestVitruvian(0);
    });

}


module.exports = function () {
    this.SetUserInfoFromJoystick = SetUserInfoFromJoystick;
}
