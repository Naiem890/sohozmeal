const axios = require("axios");

const sendSMS = async (phone, message) => {
  // eslint-disable-next-line no-undef
  const apiKey = process.env.API_KEY;
  // eslint-disable-next-line no-undef
  const senderId = process.env.SENDER_ID;
  return await axios.post(`http://bulksmsbd.net/api/smsapi`, {
    api_key: apiKey,
    type: "text",
    number: phone,
    senderid: senderId,
    message,
  });
};

module.exports = { sendSMS };
