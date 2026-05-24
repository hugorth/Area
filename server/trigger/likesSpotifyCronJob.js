const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../models/UserToken');

const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;
const lastLikedTracks = {};

/**
 * @function refreshSpotifyToken
 * @description Refreshes the Spotify access token for a given user. This function retrieves the user's refresh token from the database, sends a request to the Spotify API to get a new access token, and updates the user's token in the database.
 * 
 * @param {string} userId - The ID of the user whose Spotify token needs to be refreshed.
 * @returns {Promise<string>} The new access token.
 * 
 * @example
 * const newAccessToken = await refreshSpotifyToken('user123');
 * console.log(`New access token: ${newAccessToken}`);
 */
async function refreshSpotifyToken(userToken) {
  try {
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: userToken.refreshToken,
        client_id: config.services.spotify.clientId,
        client_secret: config.services.spotify.clientSecret,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const newAccessToken = tokenResponse.data.access_token;
    const expiresIn = tokenResponse.data.expires_in;
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await UserToken.findOneAndUpdate(
      { userId: userToken.userId, service: 'spotify' },
      { accessToken: newAccessToken, expiresAt: newExpiresAt }
    );

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getLikedTrack(userId) {
  const userToken = await UserToken.findOne({ service: 'spotify', userId });

  if (!userToken) {
    throw new Error('Spotify token not found for user.');
  }

  if (new Date() >= userToken.expiresAt) {
    console.log('Spotify token expired, refreshing...');
    const newAccessToken = await refreshSpotifyToken(userToken);
    userToken.accessToken = newAccessToken;
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/tracks?limit=1', {
      headers: {
        Authorization: `Bearer ${userToken.accessToken}`,
      },
    });

    if (response.data && response.data.items.length > 0) {
      const track = response.data.items[0].track;
      return {
        trackName: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        url: track.external_urls.spotify,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting liked track:', error.response ? error.response.data : error.message);
    throw error;
  }
}

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

async function spotifyLikeToDiscordAction(userId) {
  try {
    const userToken = await UserToken.findOne({ service: 'spotify', userId });

    if (!userToken) {
      throw new Error('Spotify token not found for user.');
    }

    const likedTrack = await getLikedTrack(userToken.userId);

    if (likedTrack) {
      if (
        lastLikedTracks[userId] &&
        lastLikedTracks[userId].trackName === likedTrack.trackName &&
        lastLikedTracks[userId].artist === likedTrack.artist
      ) {
        console.log('Same track is already liked, no message sent to Discord.');
        return;
      }

      lastLikedTracks[userId] = likedTrack;

      const message = `❤️ **${likedTrack.trackName}** by ${likedTrack.artist} has been liked!\nListen on Spotify: ${likedTrack.url}`;
      await sendDiscordMessage(message);
      console.log('Liked track update sent to Discord!');
    } else {
      console.log('No new liked track found.');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Error in spotifyLikeToDiscordAction: Spotify token might have been revoked or expired. User needs to reauthenticate.');
    } else {
      console.error('Error in spotifyLikeToDiscordAction:', error.message);
    }
  }
}

async function triggerSpotifyLikeToDiscord() {
  try {
    const usersWithSpotify = await UserToken.find({ service: 'spotify' });

    for (const user of usersWithSpotify) {
      await spotifyLikeToDiscordAction(user.userId);
    }
  } catch (error) {
    console.error('Error triggering Spotify like to Discord action:', error.message);
  }
}

const likesSpotifyCronJob = () => {
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log('Running Spotify like to Discord cron job...');
      await triggerSpotifyLikeToDiscord();
    });
    console.log('Spotify like to Discord cron job started.');
  } else {
    console.log('Spotify like to Discord cron job is already running.');
  }
};

const stopSpotifyLikeToDiscordJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Spotify like to Discord cron job stopped.');
  } else {
    console.log('No Spotify like to Discord cron job to stop.');
  }
};

module.exports = {
    likesSpotifyCronJob,
    stopSpotifyLikeToDiscordJob,
};
