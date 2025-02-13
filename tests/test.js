const fs = require("fs");
const FormData = require("form-data"); // Correct import
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// Telegram Bot Token & Chat ID
const BOT_TOKEN = "7835572148:AAGQYn9s6wikM_ey956nK6JTFTLW_LT9P-o";
const CHAT_ID = "-1002442197662"; // Replace with your group chat ID
process.env.ENVIRONMENT


// Report Data
const reportData = {
  configId: "11145",
  date: "2025-02-07",
  sender: "Anh Linh Nguyen",
  errors: [
    { message: "The playertoken is invalid", count: 1 },
    { message: '{ "error": { "message": "updateBalance" } }', count: 2859 },
  ],
};

// Function to Generate a Stylish Report Image
async function generateReportImage() {
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
  ctx.fillText(`Config ID: ${reportData.configId}`, 20, 120);
  ctx.fillText(`Sent on: ${reportData.date}`, 20, 150);
  ctx.fillText(`Sent by: ${reportData.sender}`, 20, 180);

  // Draw a separator
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.moveTo(20, 200);
  ctx.lineTo(580, 200);
  ctx.stroke();

  // Errors Section
  ctx.fillStyle = "#D9534F"; // Red
  ctx.font = "bold 16px Arial";
  ctx.fillText("Errors found:", 20, 230);

  ctx.fillStyle = "#333";
  ctx.font = "14px Arial";
  reportData.errors.forEach((error, index) => {
    ctx.fillText(`${index + 1}. ${error.message} - Count: ${error.count}`, 40, 260 + index * 25);
  });

  // Save Image
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("report.png", buffer);

  console.log("✅ Report image generated!");
  return "report.png";
}
 
async function sendImageToTelegram(imagePath) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

  // Create form-data
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", fs.createReadStream(imagePath)); // Use createReadStream

  try {
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(), // Correct headers
    });
    console.log("✅ Image sent successfully!", response.data);
  } catch (error) {
    console.error("❌ Error sending image:", error.response?.data || error.message);
  }
}

// Run the Functions
(async () => {
  const imagePath = await generateReportImage();
  await sendImageToTelegram(imagePath);
})();
