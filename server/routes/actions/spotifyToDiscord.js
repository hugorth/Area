const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../../models/UserToken');

const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;
const lastPlayedTracks = {};

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

async function getCurrentlyPlayingTrack(userId) {
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
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${userToken.accessToken}`,
      },
    });

    if (response.data && response.data.is_playing) {
      const track = response.data.item;
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
    console.error('Error getting currently playing track:', error.response ? error.response.data : error.message);
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

async function spotifyToDiscordAction(userId) {
  try {
    const userToken = await UserToken.findOne({ service: 'spotify', userId });

    if (!userToken) {
      throw new Error('Spotify token not found for user.');
    }

    const trackInfo = await getCurrentlyPlayingTrack(userToken.userId);

    if (trackInfo) {
      if (
        lastPlayedTracks[userId] &&
        lastPlayedTracks[userId].trackName === trackInfo.trackName &&
        lastPlayedTracks[userId].artist === trackInfo.artist
      ) {
        console.log('Same track is still playing, no message sent to Discord.');
        return;
      }

      lastPlayedTracks[userId] = trackInfo;

      const message = `🎶 Now playing: **${trackInfo.trackName}** by ${trackInfo.artist} (Album: ${trackInfo.album})\nListen on Spotify: ${trackInfo.url}`;
      await sendDiscordMessage(message);
      console.log('Spotify track update sent to Discord!');
    } else {
      console.log('No track is currently playing.');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Error in spotifyToDiscordAction: Spotify token might have been revoked or expired. User needs to reauthenticate.');
    } else {
      console.error('Error in spotifyToDiscordAction:', error.message);
    }
  }
}

async function triggerSpotifyToDiscord() {
  try {
    const usersWithSpotify = await UserToken.find({ service: 'spotify' });

    for (const user of usersWithSpotify) {
      await spotifyToDiscordAction(user.userId);
    }
  } catch (error) {
    console.error('Error triggering Spotify to Discord action:', error.message);
  }
}

const runSpotifyToDiscordJob = () => {
  if (!job) {
    job = cron.schedule('*/1 * * * *', async () => {
      console.log('Running Spotify to Discord cron job...');
      await triggerSpotifyToDiscord();
    });
    console.log('Spotify to Discord cron job started.');
  } else {
    console.log('Spotify to Discord cron job is already running.');
  }
};

const stopSpotifyToDiscordJob = () => {
  if (job) {
    job.stop();
    job = null;
    console.log('Spotify to Discord cron job stopped.');
  } else {
    console.log('No Spotify to Discord cron job to stop.');
  }
};

module.exports = {
  runSpotifyToDiscordJob,
  stopSpotifyToDiscordJob,
};
