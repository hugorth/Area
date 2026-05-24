const axios = require('axios');
const cron = require('node-cron');
const UserToken = require('../models/UserToken');
const discordWebhookUrl = 'https://discordapp.com/api/webhooks/1297224929296777336/-FN8WxADAs4aOGJpSg1Hn_-3IWEJLE6md7eZN__ruGiZ523GED_Z0chjuO1V7k3dcyEV';

let job = null;

/**
 * @function splitIntoCharacterLimitedChunks
 * @description Splits a given string into chunks of a specified maximum character length. This function ensures that no chunk exceeds the specified character limit.
 * 
 * @param {string} text - The string to be split into chunks.
 * @param {number} maxLength - The maximum length of each chunk.
 * @returns {string[]} An array of string chunks, each with a length not exceeding the specified maximum length.
 * 
 * @example
 * const text = "This is a long string that needs to be split into smaller chunks.";
 * const chunks = splitIntoCharacterLimitedChunks(text, 10);
 * console.log(chunks); // ["This is a ", "long strin", "g that nee", "ds to be s", "plit into ", "smaller ch", "unks."]
 */
function splitIntoCharacterLimitedChunks(tracks, maxCharacters = 2000, titleTemplate = "🎶 **{playlistName} - Partie {index}**\n") {
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;
    let index = 1;

    for (let track of tracks) {
        const trackLength = track.length + 1;
        const title = titleTemplate.replace("{index}", index).replace("{playlistName}", "Playlist");
        const titleLength = title.length;

        if (currentLength + trackLength + titleLength > maxCharacters) {
            chunks.push([...currentChunk]);
            currentChunk = [];
            currentLength = 0;
            index++;
        }

        currentChunk.push(track);
        currentLength += trackLength;
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

/**
 * @function refreshSpotifyToken
 * @description Refreshes the Spotify access token for a given user. This function retrieves the user's refresh token from the database, sends a request to the Spotify API to get a new access token, and updates the user's token in the database.
 * 
 * @param {string} userId - The ID of the user whose Spotify token needs to be refreshed.
 * @returns {Promise<string>} The new access token.
 * 
 * @example
 * const newAccessToken = await refreshSpotifyToken('user123');
 * console.log(`New access token ${newAccessToken}`);
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

/**
 * @function getPlaylistTracks
 * @description Retrieves the tracks from a specified Spotify playlist for a given user. This function checks if the user's Spotify token is expired and refreshes it if necessary. It then searches for the playlist by name and retrieves its tracks.
 * 
 * @param {string} userId - The ID of the user whose playlist tracks need to be retrieved.
 * @param {string} playlistName - The name of the playlist to search for.
 * @returns {Promise<Object[]>} A promise that resolves to an array of track objects from the specified playlist.
 * 
 * @throws Will throw an error if the Spotify token is not found for the user or if the playlist is not found.
 */
async function getPlaylistTracks(userId, playlistName) {
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
        const searchResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { Authorization: `Bearer ${userToken.accessToken}` },
            params: { q: playlistName, type: 'playlist', limit: 1 },
        });

        const playlist = searchResponse.data.playlists.items[0];
        if (!playlist) {
            throw new Error(`No playlist found with name "${playlistName}".`);
        }

        const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
            headers: { Authorization: `Bearer ${userToken.accessToken}` },
        });

        const tracks = tracksResponse.data.items.map(item => {
            const track = item.track;
            return `- **${track.name}** by ${track.artists.map(artist => artist.name).join(', ')}`;
        });

        return {
            playlistName: playlist.name,
            tracks,
            url: playlist.external_urls.spotify,
        };
    } catch (error) {
        console.error('Error getting playlist tracks:', error.response ? error.response.data : error.message);
        throw error;
    }
}

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
 * await sendDiscordMessage(webhookUrl, content);
 * console.log('Message sent successfully');
 */
async function sendDiscordMessage(message) {
    try {
        console.log('Sending message to Discord:', message);
        const response = await axios.post(discordWebhookUrl, { content: message });
        console.log('Message sent to Discord channel:', response.data);
    } catch (error) {
        console.error('Error sending message to Discord:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * @function spotifyToDiscordAction
 * @description Fetches tracks from a specified Spotify playlist for a given user and sends the track information to a Discord channel. The playlist tracks are split into chunks to comply with Discord's message length limit.
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
async function spotifyToDiscordAction(userId, playlistName) {
    try {
        if (!playlistName) {
            throw new Error('Playlist name is required.');
        }

        console.log(`Fetching playlist tracks for user: ${userId}, playlist: ${playlistName}`);
        const playlistInfo = await getPlaylistTracks(userId, playlistName);

        const trackChunks = splitIntoCharacterLimitedChunks(playlistInfo.tracks, 2000, `🎶 **${playlistInfo.playlistName} - Partie {index}**\n`);

        for (const [index, chunk] of trackChunks.entries()) {
            const message = `🎶 **${playlistInfo.playlistName} - Partie ${index + 1}**\n${chunk.join('\n')}`;
            console.log(`Sending message of length ${message.length} characters`); // Debug log
            
            try {
                await sendDiscordMessage(message);
            } catch (error) {
                console.error(`Error sending message chunk ${index + 1}:`, error.message);
            }
        }

        await sendDiscordMessage(`[Listen on Spotify](${playlistInfo.url})`);
        console.log('Playlist tracks sent to Discord in multiple messages!');

    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.error('Spotify token might be revoked or expired. User reauthentication required.');
        } else {
            console.error('Error in spotifyToDiscordAction:', error.message);
        }
    }
}

/**
 * @function triggerSpotifyToDiscord
 * @description Triggers the action to fetch tracks from a specified Spotify playlist for all users with Spotify tokens and sends the track information to a Discord channel. This function iterates over all users with Spotify tokens and calls the `spotifyToDiscordAction` for each user.
 * 
 * @param {string} playlistName - The name of the playlist to fetch tracks from.
 * @returns {Promise<void>} A promise that resolves when the action is successfully triggered for all users.
 * 
 * @throws Will throw an error if the playlist name is not provided or if there is an issue fetching the playlist tracks or sending messages to Discord.
 * 
 * @example
 * const playlistName = 'My Favorite Playlist';
 * await triggerSpotifyToDiscord(playlistName);
 * console.log('Spotify to Discord action triggered successfully for all users');
 */
async function triggerSpotifyToDiscord(playlistName) {
    try {
        if (!playlistName) {
            throw new Error('Playlist name is required.');
        }
        console.log(`Triggering Spotify to Discord action for playlist: ${playlistName}`);
        const usersWithSpotify = await UserToken.find({ service: 'spotify' });

        for (const user of usersWithSpotify) {
            await spotifyToDiscordAction(user.userId, playlistName);
        }
    } catch (error) {
        console.error('Error triggering Spotify to Discord action:', error.message);
    }
}

/**
 * @function runPLaylistSpotifyToDiscordJob
 * @description Initializes and schedules a cron job that runs at a specified interval. This job triggers the action to fetch tracks from a specified Spotify playlist for all users with Spotify tokens and sends the track information to a Discord channel.
 * 
 * @param {string} playlistName - The name of the playlist to fetch tracks from.
 * @param {string} cronSchedule - The cron schedule string to define the interval at which the job should run.
 * @returns {void}
 * 
 */
const runPLaylistSpotifyToDiscordJob = (playlistName) => {
    if (!job) {
        job = cron.schedule('*/1 * * * *', async () => {
            console.log('Running Spotify to Discord cron job...');
            await triggerSpotifyToDiscord(playlistName);
        });
        console.log('Spotify to Discord cron job started.');
    } else {
        console.log('Spotify to Discord cron job is already running.');
    }
};

/**
 * @function stopPlayListSpotifyToDiscordJob
 * @description Stops the currently running cron job that fetches tracks from a specified Spotify playlist for all users with Spotify tokens and sends the track information to a Discord channel. This function checks if the job is running and stops it if it is.
 * 
 * @returns {void}
 * 
 * @example
 * stopPlayListSpotifyToDiscordJob();
 * console.log('Cron job stopped successfully');
 */
const stopPlayListSpotifyToDiscordJob = () => {
    if (job) {
        job.stop();
        job = null;
        console.log('Spotify to Discord cron job stopped.');
    } else {
        console.log('No Spotify to Discord cron job to stop.');
    }
};

module.exports = {
    runPLaylistSpotifyToDiscordJob,
    stopPlayListSpotifyToDiscordJob,
};
