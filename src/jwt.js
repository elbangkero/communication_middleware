const { local_connection } = require('../utils/db_connection');
const multer = require('multer');
const bcrypt = require("bcrypt");

async function isEmailValid(email) {

    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegexp.test(email);
}
async function ValidateUsername(username) {
    return local_connection.query(`select * FROM users where username = '${username}'`).then(res => {
        const count = res.rowCount;
        return count == 0 ? true : false;
    });
}
async function authenticateLogin(username, password) {

    return local_connection.query(`select password FROM users where username = '${username}'`).then(res => {
        return res.rows[0].password;
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


CreateUser = async (_req, _res) => {
    //console.log(_req.body);
    const username = _req.body.username;
    const password = _req.body.password;
    const email = _req.body.email;
    const validateEMail = await isEmailValid(email);
    const validateUsername = await ValidateUsername(username);
    const statusCode = '400';
    if (!username || username.length <= 6) {
        const message = 'Username is invalid';
        console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
        _res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
        return;
    } else if (!password || password.length <= 6) {
        const message = 'Password is invalid';
        console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
        _res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
        return;
    } else if (!validateEMail) {
        const message = 'Email is invalid';
        console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
        _res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
        return;
    } else if (!validateUsername) {
        const message = 'Username already exists';
        console_log(JSON.stringify({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] }));
        _res.status(200).json({ 'statusCode': statusCode, 'status': false, message: message, 'data': [] });
        return;
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, function (err, hash) {
            let local_time = new Date().toISOString();
            local_connection.query(`INSERT INTO users(username,password,email,token,created_at,last_login) VALUES ('${username}','${hash}','${email}','','${local_time}','${local_time}')`, (err, res) => {
                if (err) {
                    console_log(`insertUser[Error]: ${err.message}`);
                } else {
                    console_log(JSON.stringify({ 'statusCode': 200, 'status': true, message: 'User Succesfully Registered', 'data': [] }));
                    _res.status(200).json({ 'statusCode': 200, 'status': true, message: 'User Succesfully Registered', 'data': [] });
                }
            });
        });
    })

};


module.exports = async function (app, jwt) {



    GenerateJWTToken = async (_req, _res) => {

        const authLogin = await authenticateLogin(_req.body.username, _req.body.password);

        console.log(authLogin);

        
        bcrypt.compare(password, hashedPassword, (error, result) => {
            if (error) console.log(error);
            console.log();


            let jwtSecretKey = process.env.JWT_SECRET_KEY;
            let data = {
                "Username": "JavaInUse",
            }
            const token = jwt.sign(data, jwtSecretKey, { expiresIn: '365d' });

            _res.send(token);
        });


    };

    ValidateJWTToken = async (_req, _res) => {
        let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
        let jwtSecretKey = process.env.JWT_SECRET_KEY;
        console.log(tokenHeaderKey);
        try {
            const token = _req.header(tokenHeaderKey);

            const verified = jwt.verify(token, jwtSecretKey);
            if (verified) {
                return _res.send("Successfully Verified");
            } else {
                return _res.status(401).send(error);
            }
        } catch (error) {
            return _res.status(401).send(error);
        }
    };


    app.post("/create-user", upload.fields([]), CreateUser);
    app.post("/generate-token", upload.fields([]), GenerateJWTToken);
    app.get("/validate-token", ValidateJWTToken);


};