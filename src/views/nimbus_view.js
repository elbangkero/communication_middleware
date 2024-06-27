const { local_connection } = require('../../utils/db_connection');


exports.API_Providers = async (_req, _res) => {
    const { page, limit, provider_name, application_id, platform, created_at } = _req.query;
    const offset = (page - 1) * limit;
    //console.log(_req.query);

    try {
        let query = `SELECT provider_id, provider_name, application_id, platform, endpoint, created_at FROM cmw_providers`;

        const queryParams = [];

        if (provider_name) {
            queryParams.push(`provider_name LIKE '%${provider_name}%'`);
        }

        if (application_id) {
            queryParams.push(`application_id LIKE '%${application_id}%'`);
        }
        if (platform) {
            const parsePlatform = JSON.parse(`${_req.query.platform}`);
            queryParams.push(`platform LIKE '%${parsePlatform.value}%'`);
        }
        if (created_at) {
            queryParams.push(`created_at::text LIKE '%${created_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }

        const countQuery = `SELECT COUNT(*) FROM cmw_providers ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY provider_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.API_Account_Providers = async (_req, _res) => {
    const { page, limit, provider_name, country_code, application_id, platform, created_at } = _req.query;
    const offset = (page - 1) * limit;
    //console.log(_req.query);

    try {
        let query = `SELECT cmw_acct_providers.acct_id, cmw_providers.provider_name, cmw_acct_providers.country_code, cmw_providers.application_id, cmw_providers.platform, cmw_acct_providers.created_at from cmw_acct_providers  LEFT join cmw_providers  ON cmw_acct_providers.provider_code = cmw_providers.provider_code`;

        const queryParams = [];

        if (provider_name) {
            queryParams.push(`cmw_providers.provider_name LIKE '%${provider_name}%'`);
        }
        if (country_code) {
            const parseCountry = JSON.parse(`${_req.query.country_code}`);
            queryParams.push(`cmw_acct_providers.country_code LIKE '%${parseCountry.value}%'`);
        }
        if (application_id) {
            queryParams.push(`cmw_providers.application_id LIKE '%${application_id}%'`);
        }
        if (platform) {
            const parsePlatform = JSON.parse(`${_req.query.platform}`);
            queryParams.push(`cmw_providers.platform LIKE '%${parsePlatform.value}%'`);
        }
        if (created_at) {
            queryParams.push(`cmw_acct_providers.created_at::text LIKE '%${created_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }

        const countQuery = `SELECT COUNT(*) FROM cmw_acct_providers  LEFT join cmw_providers  ON cmw_acct_providers.provider_code = cmw_providers.provider_code ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY cmw_acct_providers.acct_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};




exports.API_DisplayHistory = async (_req, _res) => {
    const { page, limit, player_token, campaign_name, platform, country, status, created_at, config_id } = _req.query;
    const offset = (page - 1) * limit;
    //console.log(_req.query);

    try {
        let query = `SELECT ch.history_id,ch.config_id,ch.campaign_name,ch.player_token,ch.platform,ch.country,INITCAP(case when cc.callback_status = 'Pending' then 'sent' when (cc.callback_status  IS NULL OR cc.callback_status = '') then ch.status else cc.callback_status end)  as status ,ch.created_at  FROM cmw_history ch 
        left join cmw_callback cc on cc.history_id = ch.history_id::varchar`;

        const queryParams = [];

        if (config_id) {
            queryParams.push(`config_id = '${config_id}'`);
        }

        if (player_token) {
            queryParams.push(`player_token LIKE '%${player_token}%'`);
        }

        if (campaign_name) {
            queryParams.push(`campaign_name LIKE '%${campaign_name}%'`);
        }
        if (platform) {
            const parsePlatform = JSON.parse(`${_req.query.platform}`);
            queryParams.push(`platform LIKE '%${parsePlatform.value}%'`);
        }
        if (country) {
            const parseCountry = JSON.parse(`${_req.query.country}`);
            queryParams.push(`country LIKE '%${parseCountry.value}%'`);
        }
        if (status) {
            const parseStatus = JSON.parse(`${_req.query.status}`);
            queryParams.push(`status LIKE '%${parseStatus.value}%'`);
        }
        if (created_at) {
            queryParams.push(`created_at::text LIKE '%${created_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }

        const countQuery = `SELECT COUNT(*) FROM cmw_history ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY history_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};




exports.API_DisplayTriggers = async (_req, _res) => {
    const { page, limit, campaign_name, status, triggerstatus, created_at, is_scheduled, data_source, start_at, config_id } = _req.query;
    const offset = (page - 1) * limit;

    // console.log(_req.query);
    try {

        let query = `select  config_id,status,triggerstatus,created_at,data_source,campaign_name,is_scheduled,start_at from cmw_config`;

        const queryParams = [];

        if (config_id) {
            queryParams.push(`config_id = '${config_id}'`);
        }
        if (campaign_name) {
            queryParams.push(`campaign_name LIKE '%${campaign_name}%'`);
        }

        if (status) {
            const parseStatus = JSON.parse(`${_req.query.status}`);
            queryParams.push(`status LIKE '%${parseStatus.value}%'`);
        }

        if (triggerstatus) {
            const parseTriggerStatus = JSON.parse(`${_req.query.triggerstatus}`);
            queryParams.push(`triggerstatus = '${parseTriggerStatus.value}'`);
        }

        if (created_at) {
            queryParams.push(`created_at::text LIKE '%${created_at}%'`);
        }

        if (is_scheduled) {
            const parseIsSchedule = JSON.parse(`${_req.query.is_scheduled}`);
            queryParams.push(`is_scheduled = '${parseIsSchedule.value}'`);
        }

        if (data_source) {
            const parseDataSource = JSON.parse(`${_req.query.data_source}`);
            queryParams.push(`data_source = '${parseDataSource.value}'`);
        }
        if (start_at) {
            queryParams.push(`start_at::text LIKE '%${start_at}%'`);
        }

        if (queryParams.length > 0) {
            query += ` WHERE ${queryParams.join(' AND ')}`;
        }



        const countQuery = `SELECT COUNT(*) FROM cmw_config ${queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : ''}`;
        const countResult = await local_connection.query(countQuery);

        query += ` ORDER BY config_id DESC LIMIT ${limit} OFFSET ${offset}`;

        const result = await local_connection.query(query);

        _res.json({
            data: result.rows,
            page: parseInt(page),
            total_pages: Math.ceil(countResult.rows[0].count / limit),
            total_count: countResult.rows[0].count,
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        _res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.API_ViewHistory = async (_req, _res) => {
    local_connection.query(`select * from cmw_history where history_id ='${_req.params.id}'`, (err, res) => {
        if (err) {
            console.error('Error fetching data:', err);
            _res.status(500).json({ error: 'Internal Server Error' });
        } else {
            _res.json({ data: res.rows });
        }
    });
};

exports.Sendouts_Status = async (_req, _res) => {
    //console.log(_req.params);

    local_connection.query(`
    SELECT s.status, COALESCE(COUNT(cmw.status), 0) AS count
    FROM (VALUES ('failed'), ('success')) AS s(status)
    LEFT JOIN cmw_history cmw
    ON cmw.status = s.status AND cmw.config_id ='${_req.params.config_id}'
    GROUP BY s.status
    UNION ALL
    SELECT 'total' AS status, COUNT(*)
    FROM cmw_history
    WHERE config_id ='${_req.params.config_id}';`, (err, res) => {
        if (err) {
            console.error('Error fetching data:', err);
            _res.status(500).json({ error: 'Internal Server Error' });
        } else {
            _res.json({ data: res.rows });
        }
    });
};




