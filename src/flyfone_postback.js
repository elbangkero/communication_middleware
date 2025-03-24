PostBack = async (req, res) => {
    try {
        // Extract CDR data from the request body
       

        // Log the received data (for debugging)
        console.log('Received CDR from FlyfoneTalk:', req.body);
 
        // TODO: Process and store the CDR data in your database
        // This will depend on your database setup (MongoDB, MySQL, etc.)
        // Example:
        // await db.collection('call_records').insertOne(req.body);

        // Send successful response back to FlyfoneTalk
        return res.status(200).json({
            status: 'success',
            message: 'CDR received and processed successfully'
        });
    } catch (error) {
        console.error('Error processing CDR:', error);

        // Send error response back to FlyfoneTalk
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process CDR'
        });
    }
};

module.exports = function (app) {
    app.post('/callback/flyfone', PostBack);
};