const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const joystick_connection = new Pool
    ({
        user: `${process.env.JOYSTICK_USER_DB}`,
        host: `${process.env.JOYSTICK_HOST}`,
        database: `${process.env.JOYSTICK_DATABASE}`,
        password: `${process.env.JOYSTICK_PASSWORD}`,
        port: `${process.env.JOYSTICK_DB_PORT}`,
        ssl:true,
    });


function joystick_connect() {
    joystick_connection.connect((err) => {
        if (err) {
            console_log(`Error connecting to {${process.env.JOYSTICK_HOST}}`);
            setTimeout(joystick_connect, 60000);
        } else {
            console_log(`Successfully connected to {${process.env.JOYSTICK_HOST}}`);
        }
    });
}

joystick_connection.on('error', (err) => {
    console_log('Joystick Database error');
    setTimeout(joystick_connect, 60000);
});

joystick_connect();

module.exports = joystick_connection;



