const multer = require('multer');
const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());
app.options('*', cors());
const console_log = require('./src/log_file_path');
const ControllerAPI = require('./src/Http/Controller/ControllerAPI');
const _ControllerAPI = new ControllerAPI();

const jwt = require('jsonwebtoken');

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
        cb(null, true)
    }


};

upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});



insertConfig = async (_req, _res) => {

    let data_leads;
    let local_time = new Date().toISOString();
    const date_now = new Date(local_time).toLocaleString();
    const sending = _req.body.sending == 'on' ? true : false;
    const is_scheduled = _req.body.is_scheduled == 'on' ? true : false;

    const array_connection = ['fsbo', 'zgaming'];
    if (array_connection.includes(_req.body.db_connection)) {
        db_connection = _req.body.db_connection;
    } else {
        data_leads = 'Invalid Database Connection';
        message = 'Data Connection does not exist';
        _res.status(400).json({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message });
        console_log(JSON.stringify({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message }));
        return;
    }
    if (_req.body.data_source == 'csv') {
        if (_req.files.data_leads && _req.files.data_leads.length > 0 && _req.files.data_leads[0].filename) {
            data_leads = _req.files.data_leads[0].filename;
        } else {
            data_leads = 'Invalid Data Leads';
            message = 'Data leads must be CSV or xlsx file only';
            _res.status(400).json({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message });
            console_log(JSON.stringify({ 'StatusCode': 400, 'Status': false, 'ErrorMessage': data_leads, 'Message': message }));
            return;
        }
    } else if (_req.body.data_source == 'json') {
        if (_req.body.data_leads) {
            data_leads = _req.body.data_leads
        } else {
            data_leads = 'Invalid Data Leads';
            message = 'Data leads must be encoded in base64';
            _res.status(400).json({ 'statusCode': 400, 'status': false, message: data_leads, 'Message': message });
            console_log(JSON.stringify({ 'statusCode': 400, 'status': false, message: data_leads, 'Message': message }));
            return;
        }
    } else {
        data_leads = 'Invalid Data Source';
        message = 'Data Source does not exist';
        _res.status(400).json({ 'statusCode': 400, 'status': false, 'ErrorMessage': data_leads, 'Message': message });
        console_log(JSON.stringify({ 'statusCode': 400, 'status': false, 'ErrorMessage': data_leads, 'Message': message }));
        return;
    }

    const start_at = _req.body.start_at;
    const parsedDate = new Date(start_at);

    var parseISO = !isNaN(parsedDate) ? parsedDate.toISOString() : '1998-10-06 00:00:00.000';
    const site_id = await _ControllerAPI.GetValidateSiteID(_req.body.site_id) ? _req.body.site_id : 1;
    const created_by = (_req.body.created_by == '' || _req.body.created_by == undefined) ? 'Unknown' : _req.body.created_by;
    await _ControllerAPI.GetInsertConfig(local_time, parseISO, sending, _req.body.data_source, _req.body.campaign_name, data_leads, is_scheduled, site_id, created_by, db_connection)
        .then(async function (response) {
            console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] }));
            _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'Config Added', 'data': [] });
        });
}

function verifyToken(req, res, next) {
    const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const statusCode = '400';
    const message = 'Token Verification Failed';
    try {
        const token = req.header(tokenHeaderKey);
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            next();
        } else {

            console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
            res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
            return;
        }
    } catch (error) {
        console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
        res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
        return;
    }
}



app.post('/upload/upload-config', upload.fields([
    {
        name: "data_leads",
        maxCount: 1,
    }
]), verifyToken, insertConfig);

app.listen(8043, () => {
    console_log('CMW-Worker listening on port : ' + 8043);
});
