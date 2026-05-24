const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../models/UserToken');

const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;

/**
 * @function getTopArtists
 * @description Fetches the top artists of a user from Spotify.
 * 
 * @param {string} userId - The user ID to fetch top artists for.
 * @returns {Promise<Array>} Array of top artists with name and Spotify link.
 */
async function getTopArtists(userId) {
  const userToken = await UserToken.findOne({ service: 'spotify', userId });

  if (!userToken) {
    throw new Error('Spotify token not found for user.');
  }

  if (new Date() >= userToken.expiresAt) {
    console.log('Spotify token expired, refreshing...');
    userToken.accessToken = await refreshSpotifyToken(userToken);
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: {
        Authorization: `Bearer ${userToken.accessToken}`,
      },
    });

    return response.data.items.map(artist => ({
      name: artist.name,
      url: artist.external_urls.spotify,
    }));
  } catch (error) {
    console.error('Error fetching top artists:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * @function sendDiscordMessage
 * @description Sends a message to a Discord channel.
 * 
 * @param {string} message - The message to send to Discord.
 */
async function sendDiscordMessage(message) {
  try {
    const response = await axios.post(discordWebhookUrl, {
      content: message,
    });
    console.log('Message sent to Discord channel:', response.data);
  } catch (error) {
    console.error('Error sending message to Discord:', error.message);
    throw error;
  }
}

/**
 * @function spotifyTopArtistsToDiscord
 * @description Fetches the top artists of a user on Spotify and sends a message on Discord.
 * 
 * @param {string} userId - The user ID for whom to fetch and send top artists.
 */
async function spotifyTopArtistsToDiscord(userId) {
  try {
    const topArtists = await getTopArtists(userId);

    if (topArtists.length > 0) {
      const artistList = topArtists
        .map((artist, index) => `#${index + 1}: [${artist.name}](${artist.url})`)
        .join('\n');
        
      const message = `🎶 **Top 5 Artists You’ve Listened To on Spotify** 🎶\n${artistList}`;
      await sendDiscordMessage(message);
      console.log('Top artists message sent to Discord!');
    } else {
      console.log('No top artists found.');
    }
  } catch (error) {
    console.error('Error in spotifyTopArtistsToDiscord:', error.message);
  }
}

/**
 * @function triggerSpotifyTopArtistsToDiscord
 * @description Triggers the process of fetching top artists and sending to Discord for each user with a Spotify token.
 */
async function triggerSpotifyTopArtistsToDiscord() {
  try {
    const usersWithSpotify = await UserToken.find({ service: 'spotify' });

    for (const user of usersWithSpotify) {
      await spotifyTopArtistsToDiscord(user.userId);
    }
  } catch (error) {
    console.error('Error triggering Spotify top artists to Discord action:', error.message);
  }
}

const topArtistsSpotifyCronJob = () => {
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log('Running Spotify top artists to Discord cron job...');
      await triggerSpotifyTopArtistsToDiscord();
    });
    console.log('Spotify top artists to Discord cron job started.');
  } else {
    console.log('Spotify top artists to Discord cron job is already running.');
  }
};

const stopTopArtistsSpotifyJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Spotify top artists to Discord cron job stopped.');
  } else {
    console.log('No Spotify top artists to Discord cron job to stop.');
  }
};

module.exports = {
  topArtistsSpotifyCronJob,
  stopTopArtistsSpotifyJob,
};
