function parseAPIResponse(api_response) {
    return errorMessages(api_response);
}

function errorMessages(api_response) {
    const mappings = [
        { substring: '{"message":"Invalid Site ID"}', value: 'The site ID you entered is not valid. Please check and try again.' },
        { substring: '{"message":"Provider does not exist in sms platform"}', value: 'The application_id you selected is not available on sms platform. Please choose a different application_id.' },
        { substring: '{"success":false,"error":"APIKey Expired"}', value: 'The Elastic Email API key has expired. Please try again.' },
        { substring: '{"success":false,"error":"Error: Invalid FROM email address \\"\\""}', value: 'The playertoken email address formatted incorrectly' },
        { substring: '{"success":false,"error":"template_id does not exist for application_id","errordata":""}', value: 'The template_id does not exist for the provided application_id' },
        { substring: '{"message":"Provider does not exist in email platform"}', value: 'The application_id you selected is not available on email platform. Please choose a different application_id.' },
        { substring: 'Invalid {PlayerToken}', value: 'The playertoken is invalid' },
        { substring: '{"error":{"message":"Invalid contact number"}}', value: 'The playertoken phone number formatted incorrectly' },
        { substring: '"Invalid number - phone number formatted incorrectly"', value: 'The playertoken phone number formatted incorrectly' }
    ];
    

    for (const mapping of mappings) {
        if (api_response.includes(mapping.substring)) {
            return mapping.value;
        }
    }

    return api_response;
}


module.exports = function () {
    this.parseAPIResponse = parseAPIResponse;
}