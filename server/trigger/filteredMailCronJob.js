const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken');
const mongoose = require('mongoose');
const { refreshToken } = require('../routes/services/authService');
const ProcessedMessage = require('../models/ProcessedMessage');
const Subscription = require('../models/Subscription');
const UserService = require('../models/UserService');
let job;

/**
 * @function runFilteredEmailJob
 * @description Initializes and schedules a cron job that runs every minute. This job checks for new emails from specific senders and with specific keywords in Gmail for users with Gmail tokens. It retrieves updated access tokens for each user, then uses these tokens to query the Gmail API and fetch recent messages.
 * 
 * @example
 * const runFilteredEmailJob = require('./path/to/filteredMailCronJob');
 * runFilteredEmailJob();
 */
const runFilteredEmailJob = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('=== Starting new cron job: Checking for emails from Gmail ===');
      
      const users = await UserToken.find({ service: 'gmail' });
      console.log(`Found ${users.length} users with Gmail tokens`);
      const subscription = await Subscription.findOne({ actionName: 'filtered_gmail_teams_notification' });
      console.log(subscription);
      for (const user of users) {
        try {
          console.log(`\nProcessing user: ${user.userId}`);

          const accessToken = await refreshToken('gmail', user.userId);
          
          if (!subscription || !subscription.filters) {
            console.log(`No filters found for user ${user.userId}. Skipping.`);
            continue;
          }

          const { from, subject, keywords } = subscription.filters;

          const emailResponse = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { q: `from:${from}` }
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
  
              const { payload } = messageDetails.data;
              const headers = payload.headers;
  
              const sender = headers.find(header => header.name === 'From')?.value;
              const subjects = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
              let body = '';
              if (payload.parts && payload.parts.length > 0 && payload.parts[0].body && payload.parts[0].body.data) {
                body = Buffer.from(payload.parts[0].body.data, 'base64').toString();
              } else {
                console.log(`Warning: Email with ID ${messageId} has an unexpected structure or an empty body.`);
              }
              const matchesSender = sender && sender.includes(from);
              const matchesSubject = subjects && subject && subject.includes(subject);
              const keywordsArray = Array.isArray(keywords) ? keywords : keywords ? [keywords] : [];
              const matchesKeywords =  keywordsArray.length > 0 && keywordsArray.some(keyword => body.includes(keyword));
              console.log (`Matches sender: ${matchesSender}, matches subject: ${matchesSubject}, matches keywords: ${matchesKeywords}`);
              console.log(`mail body: ${body}`);
              if (matchesSender && matchesSubject && matchesKeywords) {
                console.log(`Triggering action for message ID: ${messageId} from ${sender}`);
                
                await axios.post('http://localhost:8080/actions/trigger-filtered-email-to-teams', {
                  event: 'filtered_email_notification',
                  sender,
                  subject,
                  body
                });
                await ProcessedMessage.create({ messageId, userId: user.userId });
              } else {
                console.log(`Message ID: ${messageId} does not match the filters. Skipping.`);
              }
            }
          }
        } catch (error) {
          console.error(`Error during email check for user ${user.userId}:`, error.message);
        }
      }
      console.log('=== Filtered email cron job completed ===\n');
    } catch (error) {
      console.error('Error during scheduled job:', error.message);
    }
  });
};

const stopCronJobMail = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Cron job stopped');
  } else {
    console.log('No cron job running');
  }
};

module.exports = { runFilteredEmailJob, stopCronJobMail };
