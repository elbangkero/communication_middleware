
const { Pool } = require('pg');
const dotenv = require('dotenv');
var mysql = require('mysql');
dotenv.config();

/*
const joystick_connection = new Pool
    ({
        user: `${process.env.JOYSTICK_USER_DB}`,
        host: `${process.env.JOYSTICK_HOST}`,
        database: `${process.env.JOYSTICK_DATABASE}`,
        password: `${process.env.JOYSTICK_PASSWORD}`,
        port: `${process.env.JOYSTICK_DB_PORT}`,
        ssl: true,
    });
*/

var hv_connection = mysql.createPool({
    connectionLimit: 10,
    host: `${process.env.HV_DB_HOST}`,
    user: `${process.env.HV_DB_USER}`,
    password: `${process.env.HV_DB_PASSWORD}`,
    database: `${process.env.HV_DB_DATABASE}`,
    port: `${process.env.HV_DB_PORT}`
});

const local_connection = new Pool
    ({
        user: `${process.env.LOCAL_USER_DB}`,
        host: `${process.env.LOCAL_HOST}`,
        database: `${process.env.LOCAL_DATABASE}`,
        password: `${process.env.LOCAL_PASSWORD}`,
        port: `${process.env.LOCAL_DB_PORT}`,
    });

/*
function joystick_client() {
    joystick_connection.query(`SELECT 1`, (err, res) => {
        if (err) {
            console_log(`Error connecting to {${process.env.JOYSTICK_HOST}}`);
            setTimeout(joystick_client, 60000);
        } else {
            console_log(`Successfully connected to {${process.env.JOYSTICK_HOST}}`);
        }
    });
}
*/
function local_client() {
    local_connection.query(`SELECT 1`, (err, res) => {
        if (err) {
            console_log(`Error connecting to {${process.env.LOCAL_HOST}}`);
            setTimeout(local_client, 60000);
        } else {
            console_log(`Successfully connected to {${process.env.LOCAL_HOST}}`);
        }
    });
}


function hv_client() {
    hv_connection.query(`SELECT 1`, (err, res) => {
        if (err) {
            console_log(`Error connecting to {${process.env.HV_DB_HOST}}`);
            setTimeout(local_client, 60000);
        } else {
            console_log(`Successfully connected to {${process.env.HV_DB_HOST}}`);
        }
    });
}

//joystick_client();
local_client();
hv_client();



module.exports = { local_connection, hv_connection };