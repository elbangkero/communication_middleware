const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    user: `${process.env.JOYSTICK_USER_DB}`,
    host: `${process.env.JOYSTICK_HOST}`,
    database: `${process.env.JOYSTICK_DATABASE}`,
    password: `${process.env.JOYSTICK_PASSWORD}`,
    port: `${process.env.JOYSTICK_DB_PORT}`,
    ssl: true,
});

let connected = false;

function connect() {
  client.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      setTimeout(connect, 1000); // retry connection after 1 second
    } else {
      console.log('Connected to database.');
      connected = true;
    }
  });
}

client.on('error', (err) => {
  console.error('Unexpected error on client:', err);
  connected = false;
});

client.on('end', () => {
  console.log('Connection ended.');
  connected = false;
});

function executeQueries() {
  if (!connected) {
    console.log('Not connected to database, retrying...');
    setTimeout(executeQueries, 1000); // retry queries after 1 second
    return;
  }

  // Execute some queries here...

  setTimeout(executeQueries, 1000); // execute queries again after 1 second
}

connect(); // start initial connection

executeQueries(); // start executing queries
