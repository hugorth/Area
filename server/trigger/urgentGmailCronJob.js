const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken');
const { refreshToken } = require('../routes/services/authService');
const ProcessedMessage = require('../models/ProcessedMessage');

let job = null;

const runUrgentGmailCronJob = () => {
  if (!job) {
    cron.schedule('*/1 * * * *', async () => {
      try {
        console.log('=== Starting new cron job: Checking for new emails ===');
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
                
                const subjectHeader = messageDetails.data.payload.headers.find(header => header.name === 'Subject');
                const subject = subjectHeader ? subjectHeader.value : '';
                
                const bodyParts = messageDetails.data.payload.parts || [];
                const bodyText = bodyParts
                  .map(part => part.body.data ? Buffer.from(part.body.data, 'base64').toString() : '')
                  .join('');
                
                const isUrgent = subject.toLowerCase().includes('urgent') || bodyText.toLowerCase().includes('urgent');
                
                if (isUrgent) {
                  console.log(`"Urgent" keyword found in message. Triggering action for Teams notification.`);
                  await axios.post('http://localhost:8080/actions/trigger-keyword-to-teams', {
                    event: 'keyword_email_notification',
                    subject,
                    sender: messageDetails.data.payload.headers.find(header => header.name === 'From').value,
                  });
                  await ProcessedMessage.create({ messageId, userId: user.userId });
                }

                const isMeeting = subject.toLowerCase().includes('meeting') || bodyText.toLowerCase().includes('meeting');
                if (isMeeting) {
                  console.log(`"Meeting" keyword found in message. Triggering action for Calendar notification.`);
                  await axios.post('http://localhost:8080/actions/trigger-keyword-to-calendar', {
                    event: 'schedule_meeting_notification',
                    subject,
                    sender: messageDetails.data.payload.headers.find(header => header.name === 'From').value,
                  });
                  await ProcessedMessage.create({ messageId, userId: user.userId });
                }

                const isImportant = subject.toLowerCase().includes('important') || bodyText.toLowerCase().includes('important');
                if (isImportant) {
                  console.log(`"Important" keyword found in message. Triggering action for Slack notification.`);
                  await axios.post('http://localhost:8080/actions/trigger-keyword-to-slack', {
                    event: 'important_email_notification',
                    subject,
                    sender: messageDetails.data.payload.headers.find(header => header.name === 'From').value,
                  });
                  await ProcessedMessage.create({ messageId, userId: user.userId });
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

const stopUrgentGmailCronJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Cron job stopped.');
  } else {
    console.log('No cron job to stop.');
  }
};

module.exports = { runUrgentGmailCronJob, stopUrgentGmailCronJob };
