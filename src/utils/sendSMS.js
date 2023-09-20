const axios = require("axios");

const sendSMS = async (phone, message) => {
  // eslint-disable-next-line no-undef
  const apiKey = process.env.API_KEY;
  // eslint-disable-next-line no-undef
  const senderId = process.env.SENDER_ID;
  console.log("apiKey", apiKey);
  console.log("senderId", senderId);
  if (!apiKey || !senderId) {
    throw new Error("API_KEY or SENDER_ID is missing");
  } else if (!phone || !message) {
    throw new Error("Phone number or message is missing");
  }

  return await axios.post(`http://bulksmsbd.net/api/smsapi`, {
    api_key: apiKey,
    type: "text",
    number: phone,
    senderid: senderId,
    message: message,
  });
};

module.exports = { sendSMS };
