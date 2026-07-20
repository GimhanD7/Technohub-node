const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sends an SMS message to a user.
 * 
 * @param {Object} user - The user object containing id, phone_number, full_name
 * @param {string} message - The message content
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const sendSMS = async (user, message) => {
  if (!user || !user.phone_number) {
    console.error(`Cannot send SMS to ${user?.full_name}: No phone number provided.`);
    return false;
  }

  try {
    const apiKey = "5699|p87wUERdDtxFnhjHSoIAtovVaGUPQtSfM5LzvZIDf59a80e3";
    let formattedPhone = user.phone_number;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '94' + formattedPhone.substring(1);
    }

    const apiResponse = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: 'AITI',
        type: 'plain',
        message: message
      })
    });

    const responseData = await apiResponse.json();

    if (apiResponse.ok && responseData.status === 'success') {
      // Log the successful SMS to the database
      await prisma.sms_logs.create({
        data: {
          users: { connect: { id: user.id } },
          phone_number: user.phone_number,
          message: message,
          status: 'success',
          error_details: JSON.stringify(responseData)
        }
      });
      console.log(`SMS sent to ${user.full_name} (${user.phone_number})`);
      return true;
    } else {
      throw new Error(`Text.lk API Error: ${JSON.stringify(responseData)}`);
    }
  } catch (error) {
    console.error(`Failed to send SMS to ${user.full_name}:`, error.message || error);
    // Log failure
    try {
      await prisma.sms_logs.create({
        data: {
          users: { connect: { id: user.id } },
          phone_number: user.phone_number,
          message: message,
          status: 'failed',
          error_details: JSON.stringify({ error: error.message || 'Unknown error' })
        }
      });
    } catch (logError) {
      console.error('Failed to write failure log to DB:', logError);
    }
    return false;
  }
};

module.exports = { sendSMS };
