const axios = require("axios");

/**
 * Fetch Elastic Email report data for a given channel ID
 *
 * @param {string} apiKey - Your Elastic Email API key
 * @param {string} config_id - The channel ID
 * @returns {Promise<Object>} - The report data from Elastic Email
 */
async function getElasticReport(apiKey, config_id) {
  if (!config_id) {
    throw new Error("Missing config_id");
  }

  const url = `https://api.elasticemail.com/v4/statistics/channels/${config_id}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-ElasticEmail-ApiKey": apiKey,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch Elastic Email report:", error.message);
    throw new Error("Elastic Email API request failed");
  }
}

module.exports = { getElasticReport };
