const cron = require('node-cron');
const axios = require('axios');
const UserToken = require('../models/UserToken');
const { refreshToken } = require('../routes/services/authService');
const ProcessedMessage = require('../models/ProcessedMessage');

let job = null;

/**
 * @function runReportCronJob
 * @description Initializes and schedules a cron job that runs every minute. This job checks for report files (Excel/PDF) in Gmail for users with Gmail tokens. It retrieves updated access tokens for each user, then uses these tokens to query the Gmail API and fetch recent messages.
 * 
 * @example
 * const runReportCronJob = require('./path/to/reportCronJob');
 * runReportCronJob();
 * console.log('Report cron job scheduled successfully');
 */
const runReportCronJob = () => {
  if (!job) {
    cron.schedule('*/1 * * * *', async () => {
      try {
        console.log('=== Starting new cron job: Checking for report files (Excel/PDF) in Gmail ===');

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
                  const hasReportAttachment = messageDetails.data.payload.parts.some(part => 
                    part.filename && part.body.attachmentId && 
                    (part.filename.endsWith('.pdf') || part.filename.endsWith('.xlsx') || part.filename.endsWith('.xls'))
                  );

                  console.log(`Message ID: ${messageId} - Has report attachment: ${hasReportAttachment}`);

                  if (hasReportAttachment) {
                    console.log(`Triggering action for message ID: ${messageId} (report file: Excel or PDF)`);

                    const attachment = messageDetails.data.payload.parts.find(part => part.body.attachmentId);
                    const attachmentId = attachment.body.attachmentId;
                    
                    const attachmentData = await axios.get(`https://www.googleapis.com/gmail/v1/users/${user.userId}/messages/${messageId}/attachments/${attachmentId}`, {
                      headers: { Authorization: `Bearer ${accessToken}` },
                    });

                    await axios.post('http://localhost:8080/actions/trigger-report-to-teams', {
                      event: 'report_file_received',
                      messageId: messageId,
                      file: attachmentData.data,
                      fileName: attachment.filename
                    });

                    await axios.post('http://localhost:8080/actions/notify-teams-channel', {
                      event: 'report_file_received',
                      message: `A new report file (${attachment.filename}) has been uploaded to the Teams channel.`
                    });

                    await ProcessedMessage.create({ messageId, userId: user.userId });
                  } else {
                    console.log(`No report attachments found for message ID: ${messageId}`);
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
    console.log('Report cron job started.');
  } else {
    console.log('Report cron job already running.');
  }
};

/**
 * @function stopReportCronJob
 * @description Stops the currently running cron job that checks for report files (Excel/PDF) in Gmail for users with Gmail tokens. This function checks if the job is running and stops it if it is.
 * 
 * @returns {void}
 * 
 * @example
 * stopReportCronJob();
 * console.log('Report cron job stopped successfully');
 */
const stopReportCronJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Report cron job stopped.');
  } else {
    console.log('No report cron job to stop.');
  }
};

module.exports = { runReportCronJob, stopReportCronJob };
