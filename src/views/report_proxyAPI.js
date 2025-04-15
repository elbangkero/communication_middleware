const axios = require("axios");

exports.getElasticReport = async (_req, _res) => {
  const config_id = _req.params.config_id;
  const url = `https://api.elasticemail.com/v4/statistics/channels/${config_id}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-ElasticEmail-ApiKey":
          "2B4AC4328B8B3B4DC426FDDF39010B5164AD7573E3C3006B0F11E03BB7A4BAFDA7F0FAFCE5AC86AD35F41D419CEBC4A7",
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch Elastic Email report:", error.message);
    throw new Error("Elastic Email API request failed");
  }
};
