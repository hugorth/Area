const cron = require('node-cron');
const axios = require('axios');
const Create = require('../models/Create');
const UserToken = require('../models/UserToken');
const { refreshToken } = require('../routes/services/authService');
const { accessToken } = require('../routes/services/authService');
const ProcessedAutomation = require('../models/ProcessedAutomation');

const teamsWebhookUrl = 'https://epitechfr.webhook.office.com/webhookb2/251b7b0f-6e76-4e0a-8149-b86426a3b716@901cb4ca-b862-4029-9306-e5cd0f6d9f86/IncomingWebhook/1ebd6d34d0394b3c836a1a8f8fc1313f/c33eb7b7-f5dd-478e-99fd-e43c420b6341/V2W0SplajwXj-R0vAYB2so6WDZyl5dYORuchdR-JLe5vQ1';
const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;

const runmixmatchCronJob = () => {
    if (!job) {
        job = cron.schedule('*/1 * * * *', async () => {
            try {
                console.log('=== Starting cron job: Processing automations ===');
                
                const activeAutomations = await Create.find({ isActive: true });
                console.log(`Found ${activeAutomations.length} active automations`);
                
                for (const automation of activeAutomations) {
                    const { userId, action, reaction } = automation;
                    console.log(`Processing automation for user ${userId}`);
                    
                    const userToken = await UserToken.findOne({ service: action.services });
                    if (!userToken) {
                        console.error(`No token found for service action: ${action.services}, user: ${userId}`);
                        continue;
                    }
                    
                    const accessToken = userToken.accessToken;
                    const users = await UserToken.find({ service: 'gmail' });
                    let realUser = '';
                    for (const user of users) {
                        realUser = user.userId;
                        console.log(`\nProcessing user: ${realUser}`);
                    }
                    try {
                        const actionResult = await executeAction(action, accessToken, realUser);
                        console.log(`Processing automation for action ${action.actionName} and reaction ${reaction.reactionName} for user ${userId}`);
                        
                        if (actionResult) {
                            console.log(`Action met for ${action.actionName}. Triggering reaction ${reaction.reactionName}`);
                            const userToken_reac = await UserToken.findOne({ service: reaction.services });
                            if (!userToken_reac && (reaction.services !== 'teams' && reaction.services !== 'discord')) {
                                console.error(`No token found for service reaction: ${reaction.services}, user: ${userId}`);
                                continue;
                            }
                            const accessToken_reac = userToken_reac.accessToken;
                            await executeReaction(reaction, action, accessToken_reac, userId);
                            
                            await ProcessedAutomation.create({ automationId: automation._id, userId });
                        } else {
                            console.log(`Action condition not met for ${action.actionName}`);
                        }
                    } catch (error) {
                        console.error(`Error processing action ${action.actionName} and reaction ${reaction.reactionName} for user ${userId}:`, error.message);
                    }
                }
                
                console.log('=== Cron job completed ===\n');
            } catch (error) {
                console.error('Error during scheduled job:', error.message);
            }
        });
        console.log('Cron job started.');
    } else {
        console.log('Cron job is already running.');
    }
};

const stopmixmatchCronJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Cron job stopped.');
  } else {
    console.log('No cron job to stop.');
  }
};

const executeAction = async (action, accessToken, userId) => {
  switch (action.actionName) {
    case 'gmail_receive_email_with_keyword':
      return checkGmailUrgentKeyword(action, accessToken, userId);
    case 'github_new_commit':
      return checkGithubCommit(action, accessToken, userId);
    case 'spotify_new_song_added_to_playlist':
      return checkSpotifySongAdded(action, accessToken, userId);
    case 'teams_new_message_in_channel':
      return checkTeamsNewMessage(action, accessToken, userId);
    case 'box_new_file_added_to_folder':
      return checkBoxNewFile(action, accessToken, userId);
    default:
      console.warn(`Unknown action: ${action.actionName}`);
      return false;
  }
};

const executeReaction = async (reaction, action, accessToken, userId) => {
  switch (reaction.reactionName) {
    case 'discord_send_message_in_channel':
      return sendDiscordMessage(action, userId);
    case 'teams_create_event_in_calendar':
      return sendTeamsMessage(action, userId);
    case 'gmail_send_notification_email':
      return sendGmailNotification(action, userId, accessToken);
    case 'box_save_file':
      return saveBoxFile(action, userId, accessToken);
    case 'github_add_comment_to_issue':
      return addGithubComment(action, userId, accessToken);
    default:
      console.warn(`Unknown reaction: ${reaction.reactionName}`);
  }
};

const checkGmailUrgentKeyword = async (action, accessToken, userId) => {
  try {
    const keyword = action.keyword || 'urgent';
    console.log(`Checking Gmail for user ${userId} with keyword '${keyword}'`);

    const response = await axios.get(`https://www.googleapis.com/gmail/v1/users/${userId}/messages`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: `subject:${keyword} OR body:${keyword}` },
    });

    const messages = response.data.messages;
    if (messages && messages.length > 0) {
      console.log(`Found ${messages.length} messages for user ${userId} with keyword '${keyword}'`);
      return { success: true, messages };
    } else {
      console.log(`No messages found for user ${userId} with keyword '${keyword}'`);
      return { success: false, messages: [] };
    }
  } catch (error) {
    console.error(`Error checking Gmail for user ${userId}:`, error.message);
    return { success: false, messages: [] };
  }
};

const githubRepo = 'Hugom78/AREA';

const checkGithubCommit = async (action, accessToken, userId) => {
  try {
    console.log(`Checking GitHub repository ${githubRepo} for new commits for user ${userId}`);

    const response = await axios.get(`https://api.github.com/repos/${githubRepo}/commits`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const commits = response.data;
    if (commits && commits.length > 0) {
      console.log(`Found ${commits.length} commits in repository ${githubRepo} for user ${userId}`);
      return true;
    } else {
      console.log(`No new commits found in repository ${githubRepo} for user ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking GitHub commits for user ${userId}:`, error.message);
    return false;
  }
};

const checkSpotifySongAdded = async (action, accessToken, userId) => {
  try {
    console.log(`Checking Spotify for user ${userId} for new songs added to playlist`);

    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.data && response.data.is_playing) {
      console.log(`User ${userId} is currently playing a song`);
      return true;
    } else {
      console.log(`User ${userId} is not currently playing a song`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking Spotify for user ${userId}:`, error.message);
    return false;
  }
};

const checkTeamsNewMessage = async (action, accessToken, userId) => {
  try {
    console.log(`Checking Teams for user ${userId} for new messages in channel`);

    const response = await axios.get('https://graph.microsoft.com/v1.0/me/chats', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const chats = response.data.value;
    if (chats && chats.length > 0) {
      console.log(`Found ${chats.length} chats for user ${userId}`);
      return true;
    } else {
      console.log(`No new chats found for user ${userId}`);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error(`Access denied. Verify permissions for Teams API access and admin consent.`);
    } else {
      console.error(`Error checking Teams for user ${userId}:`, error.message);
    }
    return false;
  }
};

const checkBoxNewFile = async (action, accessToken, userId) => {
  try {
    console.log(`Checking Box folder ${boxFolderId} for new files added for user ${userId}`);

    const response = await axios.get(`https://api.box.com/2.0/folders/${boxFolderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const folder = response.data;
    const items = folder.item_collection.entries;

    if (items && items.length > 0) {
      console.log(`Found ${items.length} items in folder ${boxFolderId} for user ${userId}`);

      return items;
    } else {
      console.log(`No files found in folder ${boxFolderId} for user ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking Box for user ${userId}:`, error.response?.data || error.message);
    return false;
  }
};

const sendDiscordMessage = async (action, userId) => {
  try {
    let messageContent = `Notification: Action triggered for user ${userId}.`;

    if (action.actionName === 'gmail_receive_email_with_keyword') {
      messageContent = `User ${userId} has received a new email containing an urgent keyword.`;
      console.log(`New email with urgent keyword received for user ${userId}`);
    } else if (action.actionName === 'github_new_commit') {
      messageContent = `User ${userId} has a new commit in their GitHub repository.`;
      console.log(`New commit has been uploaded for user ${userId}`);
    } else if (action.actionName === 'spotify_new_song_added_to_playlist') {
      messageContent = `A new song has been added to the playlist for user ${userId}.`;
      console.log(`New song added to Spotify playlist for user ${userId}`);
    } else if (action.actionName === 'teams_new_message_in_channel') {
      messageContent = `A new message has been sent in Teams channel for user ${userId}.`;
      console.log(`New message sent in Teams channel for user ${userId}`);
    } else if (action.actionName === 'box_new_file_added_to_folder') {
      messageContent = `A new file has been added to Box folder for user ${userId}.`;
      console.log(`New file added to Box folder for user ${userId}`);
    }
    
    const messagePayload = {
      content: messageContent,
    };
  
    await axios.post(discordWebhookUrl, messagePayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`Sending message to Discord for user ${userId}`);
  } catch (error) {
    console.error(`Error sending message to Discord for user ${userId}:`, error.message);
  }
};

const sendTeamsMessage = async (action, userId) => {
  try {
    let messageText = `Notification: Action triggered for user ${userId}.`;

    if (action.actionName === 'gmail_receive_email_with_keyword') {
      messageText = `User ${userId} has received a new email containing an urgent keyword.`;
      console.log(`New email with urgent keyword received for user ${userId}`);
    } else if (action.actionName === 'github_new_commit') {
      messageText = `User ${userId} has a new commit in their GitHub repository.`;
      console.log(`New commit has been uploaded for user ${userId}`);
    } else if (action.actionName === 'spotify_new_song_added_to_playlist') {
      messageText = `A new song has been added to the playlist for user ${userId}.`;
      console.log(`New song added to Spotify playlist for user ${userId}`);
    } else if (action.actionName === 'teams_new_message_in_channel') {
      messageText = `A new message has been sent in Teams channel for user ${userId}.`;
      console.log(`New message sent in Teams channel for user ${userId}`);
    } else if (action.actionName === 'box_new_file_added_to_folder') {
      messageText = `A new file has been added to Box folder for user ${userId}.`;
      console.log(`New file added to Box folder for user ${userId}`);
    }
    
    const messagePayload = {
      text: messageText,
    };

    await axios.post(teamsWebhookUrl, messagePayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`Message sent to Teams channel for user ${userId}`);
  } catch (error) {
    console.error(`Error sending message to Teams for user ${userId}:`, error.message);
  }
};

const sendGmailNotification = async (action, userId, accessToken) => {
  try {
    let emailContent = ['null'];
    if (action.actionName === 'gmail_receive_email_with_keyword') {
      emailContent = [
        'From: hugo.michel78140@gmail.com',
        'To: hugo.michel78140@gmail.com',
        'Subject: Automation Notification',
        '',
        `Hello,\n\nUser ${userId} has received a new email containing an urgent keyword.\n`,
        `Triggered action: ${action.actionName}.\n`,
      ].join('\n');
    } else if (action.actionName === 'github_new_commit') {
      emailContent = [
        'From: hugo.michel78140@gmail.com',
        'To: hugo.michel78140@gmail.com',
        'Subject: Automation Notification',
        '',
        `Hello,\n\nUser ${userId} has a new commit in their GitHub repository.\n`,
        `Triggered action: ${action.actionName}.\n`,
      ].join('\n');
    } else if (action.actionName === 'spotify_new_song_added_to_playlist') {
      emailContent = [
        'From: hugo.michel78140@gmail.com',
        'To: hugo.michel78140@gmail.com',
        'Subject: Automation Notification',
        '',
        `Hello,\n\nA new song has been added to the playlist for user ${userId}.\n`,
        `Triggered action: ${action.actionName}.\n`,
      ].join('\n');
    } else if (action.actionName === 'teams_new_message_in_channel') {
      emailContent = [
        'From: hugo.michel78140@gmail.com',
        'To: hugo.michel78140@gmail.com',
        'Subject: Automation Notification',
        '',
        `Hello,\n\nA new message has been sent in Teams channel for user ${userId}.\n`,
        `Triggered action: ${action.actionName}.\n`,
      ].join('\n');
    } else if (action.actionName === 'box_new_file_added_to_folder') {
      emailContent = [
        'From: hugo.michel78140@gmail.com',
        'To: hugo.michel78140@gmail.com',
        'Subject: Automation Notification',
        '',
        `Hello,\n\nA new file has been added to Box folder for user ${userId}.\n`,
        `Triggered action: ${action.actionName}.\n`,
      ].join('\n');
    }

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await axios.post(
      `https://www.googleapis.com/gmail/v1/users/me/messages/send`,
      { raw: encodedEmail },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`Email notification sent to hugo.michel78140@gmail.com for user ${userId}`);
  } catch (error) {
    console.error(`Error sending Gmail notification for user ${userId}:`, error.response?.data || error.message);
  }
};

const FormData = require('form-data');

const boxFolderId = '291079602008';

const saveBoxFile = async (action, userId, accessToken) => {
  try {
    let fileContent = 'This is a test file created by automation.';
    let fileName = `automation-file-${Date.now()}.txt`;
    if (action.actionName === 'gmail_receive_email_with_keyword') {
      fileContent = `User ${userId} has received a new email containing an urgent keyword.`;
    } else if (action.actionName === 'github_new_commit') {
      fileContent = `User ${userId} has a new commit in their GitHub repository.`;
    } else if (action.actionName === 'spotify_new_song_added_to_playlist') {
      fileContent = `A new song has been added to the playlist for user ${userId}.`;
    } else if (action.actionName === 'teams_new_message_in_channel') {
      fileContent = `A new message has been sent in Teams channel for user ${userId}.`;
    } else if (action.actionName === 'box_new_file_added_to_folder') {
      fileContent = `A new file has been added to Box folder for user ${userId}.`;
    }

    const form = new FormData();
    form.append('attributes', JSON.stringify({
      name: fileName,
      parent: { id: boxFolderId }
    }));
    form.append('file', fileContent, { filename: fileName, contentType: 'text/plain' });

    const response = await axios.post(
      `https://upload.box.com/api/2.0/files/content`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log(`File saved in Box folder ${boxFolderId} for user ${userId}`);
  } catch (error) {
    console.error(`Error saving file to Box for user ${userId}:`, error.response?.data || error.message);
  }
};

const addGithubComment = async (action, userId, accessToken) => {
  try {
    let issueTitle = `Notification: Action triggered for user ${userId}.`;
    let issueBody = `Triggered action: ${action.actionName}.`;
    if (action.actionName === 'gmail_receive_email_with_keyword') {
      issueTitle = `User ${userId} has received a new email containing an urgent keyword.`;
      issueBody = `New email with urgent keyword received for user ${userId}`;
    } else if (action.actionName === 'github_new_commit') {
      issueTitle = `User ${userId} has a new commit in their GitHub repository.`;
      issueBody = `New commit has been uploaded for user ${userId}`;
    } else if (action.actionName === 'spotify_new_song_added_to_playlist') {
      issueTitle = `A new song has been added to the playlist for user ${userId}.`;
      issueBody = `New song added to Spotify playlist for user ${userId}`;
    } else if (action.actionName === 'teams_new_message_in_channel') {
      issueTitle = `A new message has been sent in Teams channel for user ${userId}.`;
      issueBody = `New message sent in Teams channel for user ${userId}`;
    } else if (action.actionName === 'box_new_file_added_to_folder') {
      issueTitle = `A new file has been added to Box folder for user ${userId}.`;
      issueBody = `New file added to Box folder for user ${userId}`;
    }

    console.log(`accessToken: ${accessToken}`);
    await axios.post(
      `https://api.github.com/repos/${githubRepo}/issues`,
      { title: issueTitle, body: issueBody },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch (error) {
    console.error(`Error adding comment to GitHub for user ${userId}:`, error.message);
  }
};

module.exports = { runmixmatchCronJob, stopmixmatchCronJob };
