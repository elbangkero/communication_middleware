const { Pool } = require('pg');

const dotenv = require('dotenv');

dotenv.config();

const local_connection = new Pool
    ({
        user: `${process.env.LOCAL_USER_DB}`,
        host: `${process.env.LOCAL_HOST}`,
        database: `${process.env.LOCAL_DATABASE}`,
        password: `${process.env.LOCAL_PASSWORD}`,
        port: `${process.env.LOCAL_DB_PORT}`,
    });


function local_connect() {
    local_connection.connect((err) => {
        if (err) {
            console_log(`Error connecting to {${process.env.LOCAL_HOST}}`);
            setTimeout(local_connect, 60000);
        } else {
            console_log(`Successfully connected to {${process.env.LOCAL_HOST}}`);
        }
    });
}

local_connection.on('error', (err) => {
    console_log('Local connection error');
    setTimeout(local_connect, 60000);
});

local_connect();

module.exports = local_connection;



