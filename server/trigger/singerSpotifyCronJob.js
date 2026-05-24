const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../models/UserToken');
const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;

/**
 * @function refreshSpotifyToken
 * @description Refreshes the Spotify access token for a given user.
 * 
 * @param {Object} userToken - The user token object containing the refresh token and user ID.
 * @param {string} userToken.refreshToken - The refresh token used to obtain a new access token.
 * @param {string} userToken.userId - The ID of the user whose Spotify token needs to be refreshed.
 * @returns {Promise<string>} The new access token.
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
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

/**
 * @function sendMessageWithDelay
 * @description Sends a message to Discord with a specified delay. This function waits for the given delay before sending the message to Discord.
 * 
 * @param {string} message - The message to be sent to Discord.
 * @param {number} [delay=2000] - The delay in milliseconds before sending the message. Default is 2000 milliseconds.
 * @returns {Promise<void>} A promise that resolves when the message is successfully sent after the delay.
 */
const sendMessageWithDelay = async (message, delay = 2000) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return sendMessageToDiscord(message);
  };

/**
 * @function sendDiscordMessage
 * @description Sends a message to a specified Discord webhook URL. This function formats the message content and sends it as a POST request to the Discord webhook.
 * 
 * @param {string} webhookUrl - The Discord webhook URL to send the message to.
 * @param {string} content - The content of the message to be sent.
 * @returns {Promise<void>} A promise that resolves when the message is successfully sent.
 * 
 * @example
 * const webhookUrl = 'https://discord.com/api/webhooks/...';
 * const content = 'Hello, this is a test message!';
 */
async function sendDiscordMessage(message) {
    try {
        console.log('Sending message to Discord:', message);
        const response = await axios.post(discordWebhookUrl, { content: message });
        console.log('Message sent to Discord channel:', response.data);
    }  catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfter = error.response.data.retry_after * 1000;
          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          await sendDiscordMessage(message);
        } else {
          console.error('Error sending message:', error);
        }
      }
}

/**
 * @function getArtistTracks
 * @description Retrieves the tracks from a specified artist on Spotify for a given user.
 * 
 * @param {string} userId - The ID of the user whose artist tracks need to be retrieved.
 * @param {string} artistName - The name of the artist to search for.
 * @returns {Promise<Object[]>} A promise that resolves to an array of track objects from the specified artist.
 * 
 * @throws Will throw an error if the Spotify token is not found for the user or if the artist is not found.
 */
async function getArtistTracks(userId, artistName) {
    const userToken = await UserToken.findOne({ service: 'spotify', userId });
    if (!userToken) {
        throw new Error('Spotify token not found for user.');
    }

    if (new Date() >= userToken.expiresAt) {
        console.log('Spotify token expired, refreshing...');
        userToken.accessToken = await refreshSpotifyToken(userToken);
    }

    try {
        const searchResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { Authorization: `Bearer ${userToken.accessToken}` },
            params: { q: artistName, type: 'artist', limit: 1 },
        });

        const artist = searchResponse.data.artists.items[0];
        if (!artist) {
            throw new Error(`No artist found with name "${artistName}".`);
        }

        const albumsResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/albums`, {
            headers: { Authorization: `Bearer ${userToken.accessToken}` },
            params: { include_groups: 'album', limit: 50 },
        });

        const albums = albumsResponse.data.items;
        const tracksByAlbum = {};

        for (const album of albums) {
            const tracksResponse = await axios.get(`https://api.spotify.com/v1/albums/${album.id}/tracks`, {
                headers: { Authorization: `Bearer ${userToken.accessToken}` },
            });

            tracksByAlbum[album.name] = tracksResponse.data.items.map(track => `- **${track.name}**`);
        }

        return { artistName: artist.name, tracksByAlbum };
    } catch (error) {
        console.error('Error getting artist tracks:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * @function spotifyToDiscordAction
 * @description Fetches tracks from a specified Spotify playlist for a given user and sends the track information to a Discord channel.
 * 
 * @param {string} userId - The ID of the user whose playlist tracks need to be fetched.
 * @param {string} playlistName - The name of the playlist to fetch tracks from.
 * @returns {Promise<void>} A promise that resolves when the messages are successfully sent to Discord.
 * 
 * @throws Will throw an error if the playlist name is not provided or if there is an issue fetching the playlist tracks or sending messages to Discord.
 * 
 * @example
 * const userId = 'user123';
 * const playlistName = 'My Favorite Playlist';
 * await spotifyToDiscordAction(userId, playlistName);
 * console.log('Playlist tracks sent to Discord successfully');
 */
async function spotifyToDiscordAction(userId, artistName) {
    try {
        console.log(`Fetching tracks for artist: ${artistName}`);
        const artistInfo = await getArtistTracks(userId, artistName);

        for (const [album, tracks] of Object.entries(artistInfo.tracksByAlbum)) {
            const title = `🎶 **${artistInfo.artistName} - ${album}**\n`;
            const chunks = splitIntoCharacterLimitedChunks(tracks, 2000 - title.length, title);

            for (const chunk of chunks) {
                await sendDiscordMessage(chunk.join('\n'));
            }
        }

        console.log(`All tracks by ${artistInfo.artistName} organized by album sent to Discord!`);
    } catch (error) {
        console.error('Error in spotifyToDiscordAction:', error.message);
    }
}

/**
 * @function triggerSpotifyToDiscord
 * @description Triggers the action to fetch tracks from a specified Spotify artist for all users with Spotify tokens and sends the track information to a Discord channel.
 * 
 * @param {string} artistName - The name of the artist to fetch tracks from.
 * @returns {Promise<void>} A promise that resolves when the action is successfully triggered for all users.
 * 
 * @throws Will throw an error if the artist name is not provided or if there is an issue fetching the artist tracks or sending messages to Discord.
 */
async function triggerSpotifyToDiscord(artistName) {
    try {
        if (!artistName) {
            throw new Error('Artist name is required.');
        }
        console.log(`Triggering Spotify to Discord action for artist: ${artistName}`);
        const usersWithSpotify = await UserToken.find({ service: 'spotify' });

        for (const user of usersWithSpotify) {
            await spotifyToDiscordAction(user.userId, artistName);
        }
    } catch (error) {
        console.error('Error triggering Spotify to Discord action:', error.message);
    }
}

/**
 * @function runArtistSpotifyToDiscordJob
 * @description Initializes and schedules a cron job that runs at a specified interval.
 * 
 * @param {string} artistName - The name of the artist to fetch tracks from.
 * @returns {void}
 * 
 * @example
 * const artistName = 'Artist Name';
 * runArtistSpotifyToDiscordJob(artistName);
 * console.log('Cron job scheduled successfully');
 */
const runArtistSpotifyToDiscordJob = (artistName) => {
    if (!job) {
        job = cron.schedule('*/1 * * * *', async () => {
            console.log('Running Spotify to Discord cron job...');
            await triggerSpotifyToDiscord(artistName);
        });
        console.log('Spotify to Discord cron job started.');
    } else {
        console.log('Spotify to Discord cron job is already running.');
    }
};

/**
 * @function stopArtistSpotifyToDiscordJob
 * @description Stops the currently running cron job that fetches tracks from a specified Spotify artist for all users with Spotify tokens and sends the track information to a Discord channel. 
 * 
 * @returns {void}
 */
const stopArtistSpotifyToDiscordJob = () => {
    if (job) {
        job.stop();
        job = null;
        console.log('Spotify to Discord cron job stopped.');
    } else {
        console.log('No Spotify to Discord cron job to stop.');
    }
};

module.exports = {
    runArtistSpotifyToDiscordJob,
    stopArtistSpotifyToDiscordJob,
};

/**
 * @function splitIntoCharacterLimitedChunks
 * @description Splits a list of tracks into chunks with a specified maximum character length.
 * 
 * @param {string[]} tracks - The list of tracks to split.
 * @param {number} [maxCharacters=2000] - The maximum length of each chunk.
 * @param {string} [title=""] - The title to prepend to each chunk.
 * @returns {string[][]} An array of track chunks, each not exceeding the specified length.
 * 
 * @example
 * const tracks = ["Track 1", "Track 2", "Track 3", "Track 4"];
 * const chunks = splitIntoCharacterLimitedChunks(tracks, 10, "Title");
 * console.log(chunks); // [["Title", "Track 1"], ["Title", "Track 2"], ["Title", "Track 3"], ["Title", "Track 4"]]
 */
function splitIntoCharacterLimitedChunks(tracks, maxCharacters = 2000, title = "") {
    const chunks = [];
    let currentChunk = [title];
    let currentLength = title.length;

    for (const track of tracks) {
        const trackLength = track.length + 1;
        if (currentLength + trackLength > maxCharacters) {
            chunks.push(currentChunk);
            currentChunk = [title];
            currentLength = title.length;
        }
        currentChunk.push(track);
        currentLength += trackLength;
    }

    if (currentChunk.length > 1) {
        chunks.push(currentChunk);
    }

    return chunks;
}
