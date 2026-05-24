const express = require('express');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const Subscription = require('../../models/Subscription');
const { runFilteredEmailJob } = require('../../trigger/filteredMailCronJob');
const { runCronJob, stopCronJob } = require('../../trigger/cronJobs');
const router = express.Router();
const { stopCronJobMail } = require('../../trigger/filteredMailCronJob');
const { runReportCronJob, stopReportCronJob } = require('../../trigger/reportCronJob');
const { runSpotifyToDiscordJob, stopSpotifyToDiscordJob} = require('./spotifyToDiscord');
const { runBoxToGithubJob, stopBoxToGithubJob } = require('./boxToGithub');
const {runEmailJobForSpecificSender, stopEmailJob_} = require('../../trigger/specificSenderCronJob');
const { ContactCronJob } = require('../../trigger/ContactsCronJob');
const { likesSpotifyCronJob, stopSpotifyLikeToDiscordJob } = require('../../trigger/likesSpotifyCronJob');
const {runPLaylistSpotifyToDiscordJob, stopPlayListSpotifyToDiscordJob} = require('../../trigger/playListSpotifyCronJob');
const { runArtistSpotifyToDiscordJob, stopArtistSpotifyToDiscordJob } = require('../../trigger/singerSpotifyCronJob');
const {runUrgentGmailCronJob, stopUrgentGmailCronJob} = require ('../../trigger/urgentGmailCronJob');
const { topArtistsSpotifyCronJob, stopTopArtistsSpotifyJob } = require('../../trigger/mostListenedSpotifyCronJob');
const { runDeletedFilesBoxToGithubJob, stopDeletedFileBoxToGithubJob } = require('./deletedFileBoxToGithub');
const { runReadmeBoxToGithubJob, stopReadmeBoxToGithubJob } = require('./readmeFile');
const {runaddedBoxToGithubJob, stopaddedBoxToGithubJob} = require('./addedFileBox');
const { runFolderBoxToGithubJob, stopFolderBoxToGithubJob } = require ('./folderBox');
router.get('/subscriptions/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching subscriptions for userId:', userId);

  try {
    const subscriptions = await Subscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscriptions found for this user' });
    }
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/update-filters', async (req, res) => {
  const { userId, actionName, filters } = req.body;

  try {
      const updatedSubscription = await Subscription.findOneAndUpdate(
          { userId, actionName }, 
          { filters }, 
          { new: true, upsert: true }
      );
      res.json({ message: 'Filters updated successfully', subscription: updatedSubscription });
  } catch (error) {
      console.error('Error updating filters:', error);
      res.status(500).json({ error: 'Failed to update filters' });
  }
});

router.post('/subscribe', async (req, res) => {
  const { userId, actionName, filters, playlistName, singerName } = req.body;

  try {
    const subscriptionData = { 
      userId, 
      actionName,
      singerName,
      isActive: true, 
      filters: filters || {} 
    };

    if (actionName === '5' && playlistName) {
      subscriptionData.playlistName = playlistName;
    }

    if (actionName === '8' && singerName) {
      subscriptionData.singerName = singerName;
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId, actionName },
      subscriptionData,
      { upsert: true, new: true }
    );
    if (actionName === 'filtered_gmail_teams_notification') {
      runFilteredEmailJob();
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === 'spotify_discord_action') {
      runSpotifyToDiscordJob();
      console.log('Subscribed to Spotify track playing notifications');
    } else if (actionName === 'gmail_teams_action') {
      runCronJob();
      console.log('Subscribed to email with attachment:', subscription);
    } else if (actionName == '3') {
      runReportCronJob();
      console.log('Subscribed to email with attachment and filtered email notifications:', subscription);
    } else if (actionName == '9') {
      console.log('test1');
      runBoxToGithubJob("box_user_id");
      console.log('Subscribed to A file is added or updated in a specific Box folder. Create an issue in a GitHub repository to notify developers of new changes in Box.', subscription);
    } else if (actionName === 'filtered_email_notification') {
      runEmailJobForSpecificSender();
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === '1') {
      ContactCronJob();
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === '6') {
      likesSpotifyCronJob();
      console.log('Subscribed to filtered email notifications:', subscription);

    } else if (actionName === '5') {
      runPLaylistSpotifyToDiscordJob(playlistName);
      console.log('Subscribed to playlist track notifications:', subscription);
    } else if (actionName === '8') {
      runArtistSpotifyToDiscordJob(singerName);
      console.log('Subscribed to playlist track notifications:', subscription);
    } else if (actionName === '2') {
      runUrgentGmailCronJob();
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === '7') {
      topArtistsSpotifyCronJob();
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === '11') {
      runDeletedFilesBoxToGithubJob("box_user_id");
      console.log('Subscribed to filtered email notifications:', subscription);
    } else if (actionName === '10') {
      runReadmeBoxToGithubJob("box_user_id");
      console.log('Subscribed to filtered email notificationwwwwwwwwwwwwwws:', subscription);
    } else if (actionName === '12') {
      runaddedBoxToGithubJob("box_user_id");
      console.log('Subscribed to filtered email notificationwwwwwwwwwwwwwws:', subscription);
    } else if (actionName === '13') {
      runFolderBoxToGithubJob("box_user_id");
      console.log('Subscribed to filtered email notificationwwwwwwwwwwwwwws:', subscription);
    }
    res.status(200).json({ message: 'Successfully subscribed!', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing to action', error: error.message });
  }
});

router.post('/unsubscribe', async (req, res) => {
  const { userId, actionName } = req.body;

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId, actionName },
      { isActive: false },
      { new: true }
    );

    if (actionName === 'filtered_gmail_teams_notification') {
      stopCronJobMail();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === 'spotify_discord_action') {
      stopSpotifyToDiscordJob();
      console.log('Unsubscribed to Spotify track playing notifications');
    } else if (actionName === 'gmail_teams_action') {
      stopCronJob();
      console.log('Unsubscribed from email with attachment:', subscription);
    } else if (actionName == '3') {
      stopReportCronJob();
      console.log('Unsubscribed from email with attachment and filtered email notifications:', subscription);
    } else if (actionName == '9') {
      stopBoxToGithubJob();
      console.log('Unsubscribed to A file is added or updated in a specific Box folder. Create an issue in a GitHub repository to notify developers of new changes in Box.', subscription);
    } else if (actionName === 'filtered_email_notification') {
      stopEmailJob_();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '6') {
      stopSpotifyLikeToDiscordJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '5') {
      stopPlayListSpotifyToDiscordJob();
      console.log('Unsubscribed from playlist track notifications:', subscription);
    } else if (actionName === '8') {
      stopArtistSpotifyToDiscordJob();
      console.log('Unsubscribed from playlist track notifications:', subscription);
    } else if (actionName === '2') {
      stopUrgentGmailCronJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '7') {
      stopTopArtistsSpotifyJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '11') {
      stopDeletedFileBoxToGithubJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '10') {
      stopReadmeBoxToGithubJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '12') {
      stopaddedBoxToGithubJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    } else if (actionName === '13') {
      stopFolderBoxToGithubJob();
      console.log('Unsubscribed from filtered email notifications:', subscription);
    }
    res.status(200).json({ message: 'Successfully unsubscribed!', subscription });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing from action', error: error.message });
  }
});

const teamsWebhookUrl = 'https://epitechfr.webhook.office.com/webhookb2/251b7b0f-6e76-4e0a-8149-b86426a3b716@901cb4ca-b862-4029-9306-e5cd0f6d9f86/IncomingWebhook/1ebd6d34d0394b3c836a1a8f8fc1313f/c33eb7b7-f5dd-478e-99fd-e43c420b6341/V2W0SplajwXj-R0vAYB2so6WDZyl5dYORuchdR-JLe5vQ1';

router.post('/trigger-gmail-to-teams', async (req, res) => {
  const { event } = req.body;

  if (event === 'email_with_attachment') {
    try {
      const messagePayload = {
        text: 'An email with an attachment was received in Gmail. The file will be shared in the Teams channel.',
      };

      const response = await axios.post(teamsWebhookUrl, messagePayload);

      console.log('Message sent to Teams:', response.data);
      res.status(200).json({ message: 'Action successfully triggered!' });
    } catch (error) {
      console.error('Error triggering Gmail to Teams action:', error.message);
      res.status(500).json({ message: 'Error triggering action', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'Unknown event type.' });
  }
});

router.post('/trigger-report-to-teams', async (req, res) => {
  const { event, messageId, userId, fileName } = req.body;

  if (event === 'report_file_received') {
    try {
      console.log ("MESSAGE ID :", messageId);
      const gmailLink = `https://mail.google.com/mail/u/${userId}/#inbox/${messageId}`;

      const messagePayload = {
        text: `A new report file (${fileName}) has been received. You can view the email and attachment [here](${gmailLink}).`,
      };

      const response = await axios.post(teamsWebhookUrl, messagePayload);
      console.log('Notification sent to Teams:', response.data);

      res.status(200).json({ message: 'Report file link successfully shared to Teams!' });
    } catch (error) {
      console.error('Error triggering report file link to Teams:', error.message);
      res.status(500).json({ message: 'Error triggering action', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'Unknown event type.' });
  }
});


const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

router.post('/trigger-spotify-to-discord', async (req, res) => {
  const { event } = req.body;

  if (event === 'spotify_playing_track') {
    try {
      const messagePayload = {
        content: 'A new track is now playing on Spotify!',
      };

      const response = await axios.post(discordWebhookUrl, messagePayload);

      console.log('Message sent to Discord:', response.data);
      res.status(200).json({ message: 'Action successfully triggered!' });
    } catch (error) {
      console.error('Error triggering Spotify to Discord action:', error.message);
      res.status(500).json({ message: 'Error triggering action', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'Unknown event type.' });
  }
});

router.post('/trigger-keyword-to-teams', async (req, res) => {
  const { event, subject, sender } = req.body;

  if (event === 'keyword_email_notification') {
      try {
          const messagePayload = {
              text: `🔔 **Important Notification!** \n\n You have received an email containing an important keyword!\n\n**Subject**: "${subject}"\n**Sender**: ${sender}`,
          };
          const response = await axios.post(teamsWebhookUrl, messagePayload);
          console.log('Keyword notification sent to Teams:', response.data);
          res.status(200).json({ message: 'Keyword notification successfully sent to Teams!' });
      } catch (error) {
          console.error('Error sending keyword notification to Teams:', error.message);
          res.status(500).json({ message: 'Error sending notification', error: error.message });
      }
  } else {
      res.status(400).json({ message: 'Unknown event type.' });
  }
});

router.post('/notify-teams-channel', async (req, res) => {
  const { event, message } = req.body;

  if (event === 'report_file_received') {
    try {
      const messagePayload = {
        text: message,
      };

      const response = await axios.post(teamsWebhookUrl, messagePayload);

      console.log('Notification sent to Teams:', response.data);
      res.status(200).json({ message: 'Notification successfully sent to Teams channel!' });
    } catch (error) {
      console.error('Error sending notification to Teams channel:', error.message);
      res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'Unknown event type.' });
  }
});

router.post('/trigger-filtered-email-to-teams', async (req, res) => {
  const { event, sender, subject } = req.body;

  if (event === 'filtered_email_notification') {
    try {
      const messagePayload = {
        text: `You received an email from ${sender} with the subject: "${subject}".`,
      };

      const response = await axios.post(teamsWebhookUrl, messagePayload);

      console.log('Message sent to Teams:', response.data);
      res.status(200).json({ message: 'Filtered email notification sent to Teams!' });
    } catch (error) {
      console.error('Error sending filtered email notification to Teams:', error.message);
      res.status(500).json({ message: 'Error triggering action', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'Unknown event type.' });
  }
});

router.post('/configure', async (req, res) => {
  const { event, reaction, filters, userId } = req.body;

  try {
    if (event === 'email_with_attachment' && reaction === 'send_teams_message') {
      console.log('Action Gmail to Teams configured for email with attachment.');
      res.status(200).json({ message: 'Gmail to Teams action configured successfully!' });

    } else if (event === 'spotify_playing_track' && reaction === 'send_discord_message') {
      console.log('Action Spotify to Discord configured for track playing.');
      res.status(200).json({ message: 'Spotify to Discord action configured successfully!' });

    } else if (event === 'filtered_email_notification' && reaction === 'send_teams_message') {
      console.log('Filtered email notification configured for Gmail to Teams.');

      const { from, subject, keywords } = filters;

      const keywordsArray = keywords ? keywords.split(' ') : [];
      await Subscription.findOneAndUpdate(
        { userId: userId, actionName: 'filtered_email_notification' },
        { filters: { from, subject, keywords: keywordsArray }, isActive: true },
        { upsert: true, new: true }
      );

      res.status(200).json({ message: 'Filtered Gmail to Teams action configured successfully!' });
    } else {
      res.status(400).json({ message: 'Unknown event or reaction type.' });
    }
  } catch (error) {
    console.error('Error configuring action:', error.message);
    res.status(500).json({ message: 'Error configuring action', error: error.message });
  }
});

module.exports = router;
