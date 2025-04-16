const axios = require("axios");
const { ElasticEmailAccount } = require("../provider_api/elastic_email");

exports.getElasticReport = async (_req, _res) => {
    const config_id = _req.params.config_id;
    const provider_code = _req.query.provider_code;
    if (!provider_code || !config_id) {
        return _res.status(400).json({ error: "Missing required parameter" });
    }

    const url = `https://api.elasticemail.com/v4/statistics/channels/${config_id}`;

    try {
        const apikeyObj = await ElasticEmailAccount('', provider_code);
        const response = await axios.get(url, {
            headers: {
                "X-ElasticEmail-ApiKey": apikeyObj.apikey,
                "Content-Type": "application/json",
            },
        });

        _res.status(200).json(response.data);
    } catch (error) {
        console.error("Failed to fetch Elastic Email report:", error.message);
        _res.status(500).json({ error: "Elastic Email API request failed" });
    }
};

