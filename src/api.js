const console_log = require('./log_file_path');
const local_db = require('../utils/local_db_connection');
const joystick_db = require('../utils/joystick_db_connection'); 

 
local_db.query(`select * from cmw_config cc `, (err, res) => {
    if (err) {
        console_log(`Error executing query: ${err.message}`);
    } else {
        console_log(`Query result: ${JSON.stringify(res.rows)}`);
    }
});


joystick_db.query(`select * from  afun_afun.player_data pd  limit 1`, (err, res) => {
    if (err) {
        console_log(`Error executing query: ${err.message}`);
    } else {
        console_log(`Query result: ${JSON.stringify(res.rows)}`);
    }
});
