const { local_connection } = require('../../utils/db_connection');
const axios = require('axios');

async function ElasticEmailAccount(country_code) {

    const res = await local_connection.query(`SELECT * FROM cmw_acct_providers where provider_code = '${process.env.PROVIDER_ELASTIC_EMAIL}'  and rand = 'Spin The Wheel' LIMIT 1`);
    const data = res.rows;

    const results = await Promise.all(
        data.map(async row => {
            return { 'apikey': row.apikey };
        })
    );
    if (results.length > 0) {
        return results[0];
    } else {
        return { 'apikey': '' };
    }

}


async function SpinTheWheelSender(from, email, subject, template_id, fromName, country_code, merge) {

    const apikey = await ElasticEmailAccount(country_code);

    const email_subject = subject ? encodeURIComponent(subject) : encodeURIComponent('(no subject)');
    const encodedfromName = encodeURIComponent(fromName);

    const merge_params = new URLSearchParams(merge);

    var merge_type = "";
    merge_params.forEach((value, key) => {
        merge_type += `&merge_${key}=${value}`;
    });

    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subject}&fromName=${encodedfromName}&from=${from}&to=${email}&template=${template_id}&isTransactional=true&apikey=${apikey.apikey}&${merge_type}`,
            headers: {}
        };


        axios(config)
            .then(function (response) {
                if (response.data.success)
                    resolve(response)
                else
                    reject(response);
            })
            .catch(function (error) {
                reject(error);
            });

    });

}


module.exports = { SpinTheWheelSender };