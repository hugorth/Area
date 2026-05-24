const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken');
const { refreshToken } = require('../routes/services/authService');
const ProcessedMessage = require('../models/ProcessedMessage');

let job = null;

/**
 * @function runCronJob
 * @description Initializes and schedules a cron job that runs every minute. This job checks for new emails with attachments and specific keywords in Gmail for users with Gmail tokens. It retrieves updated access tokens for each user, then uses these tokens to query the Gmail API and fetch recent messages.
 * 
 * @example
 * const runCronJob = require('./path/to/cronJobs');
 * runCronJob();
 */

const runCronJob = () => {
  if (!job) {
    cron.schedule('*/1 * * * *', async () => {
      try {
        console.log('=== Starting new cron job: Checking for new emails with attachments in Gmail ===');
        
        const users = await UserToken.find({ service: 'gmail' });
        console.log(`Found ${users.length} users with Gmail tokens`);
    
        for (const user of users) {
          try {
            console.log(`\nProcessing user: ${user.userId}`);
            
            const accessToken = await refreshToken('gmail', user.userId);
            console.log(`Access token for user ${user.userId}: ${accessToken}`);
    
            const emailResponse = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
    
            const messages = emailResponse.data.messages;
            console.log(`Found ${messages ? messages.length : 0} messages for user ${user.userId}`);
    
            if (messages && messages.length > 0) {
              for (const message of messages) {
                const messageId = message.id;
    
                const alreadyProcessed = await ProcessedMessage.findOne({ messageId, userId: user.userId });
                if (alreadyProcessed) {
                  console.log(`Message ID: ${messageId} already processed. Skipping.`);
                  continue;
                }
    
                console.log(`Processing message ID: ${messageId}`);
    
                const messageDetails = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages/${messageId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
    
                if (messageDetails.data.payload && messageDetails.data.payload.parts) {
                  const hasAttachment = messageDetails.data.payload.parts.some(part => part.filename && part.body.attachmentId);
                  console.log(`Message ID: ${messageId} - Has attachment: ${hasAttachment}`);
    
                  if (hasAttachment) {
                    console.log(`Triggering action for message ID: ${messageId} (email with attachment)`);
                    await axios.post('http://localhost:8080/actions/trigger-gmail-to-teams', {
                      event: 'email_with_attachment',
                    });
    
                    await ProcessedMessage.create({ messageId, userId: user.userId });
                  } else {
                    console.log(`No attachments found for message ID: ${messageId}`);
                  }
                } else {
                  console.log(`Message ID: ${messageId} does not have parts (likely no attachments)`);
                }
              }
            }
          } catch (error) {
            console.error(`Error during email check for user ${user.userId}:`, error.message);
          }
        }
        console.log('=== Cron job completed ===\n');
      } catch (error) {
        console.error('Error during scheduled job:', error.message);
      }
    });
    console.log('Cron job started.');
  } else {
    console.log('Cron job already running.');
  }
};

const stopCronJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Cron job stopped.');
  } else {
    console.log('No cron job to stop.');
  }
};

module.exports = { runCronJob, stopCronJob };
