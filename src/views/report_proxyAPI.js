const axios = require("axios");
const ControllerElasticEmail = require('.././Http/Controller/Provider/ControllerElasticEmail');
const _ControllerElasticEmail = new ControllerElasticEmail();

exports.getElasticReport = async (_req, _res) => {
    const config_id = _req.params.config_id;
    if (!config_id) {
        return _res.status(400).json({ error: "Missing required parameter" });
    }

    const url = `https://api.elasticemail.com/v4/statistics/channels/${config_id}`;

    try {
        const res = await _ControllerElasticEmail.GetElasticEmailApiKey(config_id);
        if (!res || !res.rows[0] || !res.rows[0].apikey) {
            console.error("No API key found for the given config_id.");
            _res.status(500).json({ error: "No API key found for the given config_id." });
        } else { 
            const response = await axios.get(url, {
                headers: {
                    "X-ElasticEmail-ApiKey":res.rows[0].apikey,
                    "Content-Type": "application/json",
                },
            });

            _res.status(200).json(response.data);
        }

    } catch (error) {
        console.error("Failed to fetch Elastic Email report:", error.message);
        _res.status(500).json({ error: `Failed to fetch Elastic Email report:${error.message}` });
    }
};

