const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const { local_connection } = require('../../utils/db_connection');
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function TelegramBot(success_rate_ratio) {
  CheckingSuccessRate(success_rate_ratio)
}

async function CheckingSuccessRate(rate) {

  let total = rate.success + rate.failed;
  const successRate = total > 0 ? (rate.success / total) * 100 : 0;
  if (successRate < 60) {
    await delay(2000);
    const msg = await GetListofError(rate.config_id);
    const sentBy = await GetSentBy(rate.config_id);
    Sending(msg.rows, rate.config_id, sentBy.rows[0].created_by);
  }
  return false;
}

async function Sending(msg = [], config_id, created_by) {

  const imagePath = await generateReportImage(msg, config_id, created_by);
  await sendImageToTelegram(imagePath);
}

async function generateReportImage(msg, config_id, created_by) {
  const width = 600;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = "#1877F2"; // Dark Blue
  ctx.fillRect(0, 0, width, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("📢    Summary Report", 20, 30);

  // Title
  ctx.fillStyle = "#333";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Failed sendouts found in the campaign", 20, 80);

  // Report Details
  ctx.font = "16px Arial";
  ctx.fillText(`Config ID: ${config_id}`, 20, 120);
  ctx.fillText(`Sent on: ${new Date(msg[0].created_at).toISOString().split('T')[0]}`, 20, 150);
  ctx.fillText(`Sent by: ${created_by}`, 20, 180);

  // Draw a separator
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.moveTo(20, 200);
  ctx.lineTo(580, 200);
  ctx.stroke();

  // Errors Section
  ctx.fillStyle = "#D9534F"; // Red
  ctx.font = "bold 16px Arial";
  ctx.fillText("⚠️    Errors found:", 20, 230);

  ctx.fillStyle = "#333";
  ctx.font = "14px Arial";
  msg.forEach((error, index) => {
    ctx.fillText(`${index + 1}. ${error.api_response} - Count: ${error.count}`, 40, 260 + index * 25);
  });

  // Save Image
  const buffer = canvas.toBuffer("image/png");
  const dirPath = "./images";
  const filePath = `${dirPath}/${config_id}_report.png`;

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(filePath, buffer);

  if (fs.existsSync(filePath)) {
    return filePath;
  } else {
    return null;
  }
}

async function sendImageToTelegram(imagePath) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendPhoto`;

  // Create form-data
  const formData = new FormData();
  formData.append("chat_id", process.env.TELEGRAM_API_CHAT_ID);
  formData.append("photo", fs.createReadStream(imagePath)); // Use createReadStream

  try {
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(), // Correct headers
    });
    // Delete image after successful sending
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      } else {
        console.log("Telegram Bot sent successfully!");
      }
    });
  } catch (error) {
    console.error("Telegram Bot error:", error.response?.data || error.message);
  }


}

async function GetListofError(config_id) {
  return new Promise(async (resolve, reject) => {
    local_connection.query(`select created_at::date,api_response,count(*) from cmw_history ch where status = 'failed' and config_id = '${config_id}' group by created_at::date,api_response order by created_at desc;`, (err, res) => {
      err ? reject(`GetListofError[Error]: ${err.message}`) : resolve(res);
    })
  });
}
async function GetSentBy(config_id) {
  return new Promise(async (resolve, reject) => {
    local_connection.query(`select created_by  from cmw_config cc where cc.config_id = '${config_id}'; `, (err, res) => {
      err ? reject(`GetSentBy[Error]: ${err.message}`) : resolve(res);
    })
  });
}

module.exports = { TelegramBot };
