const { local_connection } = require('../utils/db_connection');
const multer = require('multer');
const axios = require('axios');

var interval = 3000;

(async () => {
    const client = await local_connection.connect();
    await client.query('LISTEN ftp_listener');
    client.on('notification', function (data) {
        getConfig(parseInt(data.payload));
        //console.log("data", JSON.parse(data.payload));
        function getConfig(dataload) {
            local_connection.query(`SELECT * FROM ftp_email where triggerstatus='active' and sending ='true' and status !='sending'`).then(res => {
                const data = res.rows;
                console_log(`Config queue count : ${res.rowCount}`);

                console_log(`payload : ${dataload}`);
                const callback = dataload == res.rowCount;
                if (callback) {
                    data.forEach(function (el, index) {

                        setTimeout(async function () {
                            const utf8encoded = (new Buffer.from(el.payload, 'base64')).toString('utf8');
                            //console.log(utf8encoded);
                            const obj = JSON.parse(utf8encoded);

                            const merge_data = obj.merge ? obj.merge : '';
                            await sendEmail(obj.from, obj.email, obj.subject, obj.templateID, obj.fromName, merge_data)
                                .then(function (response) {
                                    console_log(`Status : ${obj.token} Sent, ` + `Campaign : FreeToPlay Email`);
                                    StoreFTPEmailHistory(el.id,obj.name,obj.email,obj.token,obj.from,obj.fromName,obj.subject,obj.templateID,JSON.stringify(obj.merge),'success',JSON.stringify(response.data));
                                }).catch(function (error) {
                                    console_log(`Status : ${obj.token} Failed, ` + `Campaign : FreeToPlay Email}`);
                                    StoreFTPEmailHistory(el.id,obj.name,obj.email,obj.token,obj.from,obj.fromName,obj.subject,obj.templateID,JSON.stringify(obj.merge),'failed',JSON.stringify(error.data));
                                }).finally(async function () {
                                    local_connection.query(`update ftp_email set triggerstatus= 'inactive' , status = 'sent' where id=${el.id}`, (err, res) => {
                                        if (err) {
                                            console_log(`Error executing query: ${err.message}`);
                                        }
                                    });
                                });

                        }, index * interval);
                    })

                }

            })
        }


    });


})();


async function sendEmail(from, email, subject, template_id, fromName, merge_data) {


    const apikey = '7C41D4746E1C491FAB5CC72DFF9EF3F117A02CD035AEACE30E9823CD3D0581D20B61291546D6AF53BEA633563CE388E8'
    const email_subject = subject ? encodeURIComponent(subject) : encodeURIComponent('(no subject)');
    const encodedfromName = encodeURIComponent(fromName);
    var merge_params = ""; 
    for (const key in merge_data) {
        merge_params += `&${key}=${merge_data[key]}`;
    } 
    
    return new Promise(async (resolve, reject) => {

        var config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `https://api.elasticemail.com/v2/email/send?subject=${email_subject}&fromName=${encodedfromName}&from=${from}&to=${email}&template=${template_id}&isTransactional=true&apikey=${apikey}&${merge_params}`,
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

async function StoreFTPEmailHistory(email_id, name, email, token, from, fromname, subject, template_id,merge,status,api_response) {


    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    local_connection.query(`INSERT INTO ftp_email_history (email_id,name,email,token,"from",fromname,subject,template_id,merge,status,api_response,created_at,updated_at) VALUES ('${email_id}','${name}','${email}','${token}','${from}','${fromname}','${subject}','${template_id}','${merge}','${status}','${api_response}','${date_now}','${date_now}')`, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err}`);
        }
    });
}



const multerStorage = multer.diskStorage({

    destination: (req, file, cb) => {
        if (file.fieldname === "data_leads") {
            cb(null, './uploads/data_leads');
        }
    },

    filename: (req, file, cb) => {
        if (file.fieldname === "data_leads") {
            cb(null, `${Date.now()}_${file.originalname}`)
        }
    }
});
const multerFilter = (req, file, cb) => {
    if (file.fieldname === "data_leads") {
        if (!file.originalname.match(/\.csv$|\.xlsx$/)) {
            // upload only png and jpg format
            return cb(new Error('Please upload a CSV or xlsx file only'))
        }
        cb(null, true)
    }


};
upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

insertEmailRequest = async (_req, _res) => {
    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    local_connection.query(`INSERT INTO ftp_email (status,triggerstatus,sending,payload,created_at,updated_at) VALUES ('pending','active','${_req.body.sending}','${_req.body.payload}','${date_now}','${date_now}')`, (err, res) => {
        if (err) {
            console_log(`Error executing query: ${err.message}`);
        } else {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Request Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Request Added', 'data': [] });
        }
    });

}






module.exports = function (app) {

    app.post('/ftp-upload', upload.fields([]), insertEmailRequest);


};