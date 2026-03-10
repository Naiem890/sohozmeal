import axios, { AxiosResponse } from 'axios';

export const sendSMS = async (message: string, phones: string | string[]): Promise<AxiosResponse> => {
  const apiKey = process.env.API_KEY;
  const senderId = process.env.SENDER_ID;

  if (!apiKey || !senderId) {
    throw new Error('API_KEY or SENDER_ID is missing');
  } else if (!phones || !message) {
    throw new Error('Phone number or message is missing');
  }

  const number = Array.isArray(phones) ? phones.join(',') : phones;

  return await axios.post('http://bulksmsbd.net/api/smsapi', {
    api_key: apiKey,
    type: 'text',
    number,
    senderid: senderId,
    message,
  });
};
