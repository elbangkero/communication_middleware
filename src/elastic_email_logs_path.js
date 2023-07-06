

const path = require('path');
const fs = require('fs');
const logFilePath = path.join('./logs/elastic', `elastic-${getCurrentDate()}.log`);
var dir = './logs/elastic';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Redirect console output to a file
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
elastic_log = function (message) {
    logStream.write(`${message},\n`);
};


function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}



module.exports = elastic_log;