const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken'); 
const { refreshToken } = require('../routes/services/authService'); 
const teamsWebhookUrl = 'https://epitechfr.webhook.office.com/webhookb2/251b7b0f-6e76-4e0a-8149-b86426a3b716@901cb4ca-b862-4029-9306-e5cd0f6d9f86/IncomingWebhook/1ebd6d34d0394b3c836a1a8f8fc1313f/c33eb7b7-f5dd-478e-99fd-e43c420b6341/V2W0SplajwXj-R0vAYB2so6WDZyl5dYORuchdR-JLe5vQ1';
const Subscription = require('../models/Subscription');
const ProcessedMessage = require('../models/ProcessedMessage');

let job;

/**
 * @function runEmailJobForSpecificSender
 * @description Schedules a cron job to check for new emails from a specific sender for users with Gmail tokens.
 * 
 * @param {string} senderEmail - The email address of the specific sender to check for.
 * @returns {void}
 * 
 * @example
 * const senderEmail = 'example@example.com';
 * runEmailJobForSpecificSender(senderEmail);
 * console.log('Cron job scheduled successfully');
 */
const runEmailJobForSpecificSender = () => {
  job = cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('=== Starting cron job: Retrieving latest emails from specific sender ===');
      
      const users = await UserToken.find({ service: 'gmail' });
      console.log(`Found ${users.length} users with Gmail tokens`);

      const subscription = await Subscription.findOne({ actionName: 'filtered_email_notification' });
      console.log(subscription);
      const specificSenderEmail = subscription.filters.from;
      console.log("Specific Sender Email:", specificSenderEmail);

      for (const user of users) {
        try {
          console.log(`\nProcessing user: ${user.userId}`);
          
          const accessToken = await refreshToken('gmail', user.userId);
          if (!specificSenderEmail) {
            console.log(`No specific sender email configured for user ${user.userId}. Skipping...`);
            continue; 
          }

          const emailResponse = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              q: `from:${specificSenderEmail}`, 
              maxResults: 20 
            }
          });
  
          const messages = emailResponse.data.messages;
          console.log(`Found ${messages ? messages.length : 0} messages from ${specificSenderEmail} for user ${user.userId}`);
  
          if (messages && messages.length > 0) {
            let emailSummaries = [];
  
            for (const message of messages) {
              const messageId = message.id;
  
              const alreadyProcessed = await ProcessedMessage.findOne({ messageId, userId: user.userId });
              if (alreadyProcessed) {
                console.log(`Message ID: ${messageId} already processed. Skipping.`);
                continue;
              }

              const messageDetails = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
  
              const { payload } = messageDetails.data;
              const headers = payload.headers;
              const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
              const date = headers.find(header => header.name === 'Date')?.value || 'No Date';
              const snippet = messageDetails.data.snippet;

              emailSummaries.push(
                `**Subject**: ${subject}\n` +
                `**Date**: ${date}\n` +
                `**Snippet**: ${snippet}\n` +
                '-------------------------------------------'
              );
            }

            const messagePayload = {
              text: `You have received the following 20 latest emails from ${specificSenderEmail}:\n\n${emailSummaries.join('\n\n')}`,
            };

            const response = await axios.post(teamsWebhookUrl, messagePayload);
            console.log('Message sent to Teams:', response.data);
          } else {
            console.log(`No new emails from ${specificSenderEmail} found for user ${user.userId}`);
          }
        } catch (error) {
          console.error(`Error during email check for user ${user.userId}:`, error.message);
        }
      }
      
      console.log('=== Cron job completed ===');
    } catch (error) {
      console.error('Error during scheduled job:', error.message);
    }
  });
};

/**
 * @function stopEmailJob_
 * @description Stops the currently running cron job that checks for new emails from a specific sender.
 * 
 * @returns {void}
 * 
 * @example
 * stopEmailJob_();
 * console.log('Cron job stopped');
 */
const stopEmailJob_ = () => {
  if (job) {
    job.stop();
    console.log('Cron job stopped');
  } else {
    console.log('No cron job running');
  }
};

module.exports = { runEmailJobForSpecificSender, stopEmailJob_ };
