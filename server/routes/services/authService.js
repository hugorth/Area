const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const UserToken = require('../../models/UserToken');
const router = express.Router();

async function refreshToken(service, userId) {
  const userToken = await UserToken.findOne({ service, userId });

  if (!userToken) {
    throw new Error(`No token found for this service: ${service}, user: ${userId}`);
  }

  if (new Date() < userToken.expiresAt) {
    console.log(`Token still valid for service: ${service}, user: ${userId}`);
    return userToken.accessToken;
  }

  let tokenResponse;
  if (service === 'gmail') {
    tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: config.services.gmail.clientId,
        client_secret: config.services.gmail.clientSecret,
        refresh_token: userToken.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
  }

  const newAccessToken = tokenResponse.data.access_token;
  const expiresIn = tokenResponse.data.expires_in;
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await UserToken.findOneAndUpdate(
    { userId, service },
    { accessToken: newAccessToken, expiresAt: newExpiresAt }
  );

  return newAccessToken;
}

router.get('/services/callback', async (req, res) => {
  const { code, state: service} = req.query;

  if (!code || !service) {
    console.error('OAuth callback failed: missing code or state');
    return res.status(400).send('OAuth callback failed: code or state missing');
  }

  const client = req.headers[`sec-ch-ua-platform`];
  console.log(`Service OAuth callback initiated. Code: ${code}, Service: ${service}`);

  try {
    let tokenResponse;
    let accessToken;
    let refreshToken;
    let expiresIn;
    let idToken;
    let userId;

    if (service === 'gmail') {
      console.log('Connecting Gmail service...');
      tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: config.services.gmail.clientId,
          client_secret: config.services.gmail.clientSecret,
          redirect_uri: config.services.gmail.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      idToken = tokenResponse.data.id_token;
      console.log('Gmail OAuth token response:', tokenResponse.data);
      console.log('Access Token:', accessToken);

      if (idToken) {
        const decodedToken = jwt.decode(idToken);
        console.log('Decoded Token:', decodedToken);
        userId = decodedToken.sub;
        console.log("UserID décodé depuis l'id_token:", userId);
      } else {
        try {
          console.log("Récupération des infos utilisateur avec l'access token");
          const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          console.log('User Info Response:', userInfoResponse.data);
          userId = userInfoResponse.data.sub;
          console.log("UserID récupéré depuis l'API userinfo:", userId);
        } catch (error) {
          console.error('Erreur lors de la récupération des informations utilisateur:', error.response ? error.response.data : error.message);
          return res.status(400).send('Erreur lors de la récupération des informations utilisateur');
        }        
      }

      if (!userId) {
        console.error('User ID missing in decoded token or userinfo');
        return res.status(400).send('User ID missing');
      }

    } else if (service === 'teams') {
      console.log('Connecting Teams service...');
      tokenResponse = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          code,
          client_id: config.services.teams.clientId,
          client_secret: config.services.teams.clientSecret,
          redirect_uri: config.services.teams.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      userId = 'teams_user_id';
      console.log('Teams OAuth token response:', tokenResponse.data);

    } else if (service === 'dropbox') {
      console.log('Connecting Dropbox service...');
      tokenResponse = await axios.post(
        'https://api.dropboxapi.com/oauth2/token',
        new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: config.services.dropbox.clientId,
          client_secret: config.services.dropbox.clientSecret,
          redirect_uri: config.services.dropbox.redirectUri,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      userId = 'dropbox_user_id';
      console.log('Dropbox OAuth token response:', tokenResponse.data);

    } else if (service === 'github') {
      console.log('Connecting GitHub service...');
      tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        new URLSearchParams({
          code,
          client_id: config.services.github.clientId,
          client_secret: config.services.github.clientSecret,
          redirect_uri: config.services.github.redirectUri,
        }).toString(),
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      userId = 'box_user_id';
      console.log('GitHub OAuth token response:', tokenResponse.data);

      expiresIn = null;

    } else if (service === 'spotify') {
      console.log('Connecting Spotify service...');
      tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          code,
          client_id: config.services.spotifyAuth.clientId,
          client_secret: config.services.spotifyAuth.clientSecret,
          redirect_uri: config.services.spotifyAuth.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
    
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      
      const userInfoResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    
      userId = userInfoResponse.data.id;
      console.log('Spotify OAuth token response:', tokenResponse.data);
      console.log('Spotify User ID:', userId);
    } else if (service === 'x') {
      console.log('Connecting X service...');
      tokenResponse = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          code,
          client_id: config.authProviders.xAuth.clientId,
          client_secret: config.authProviders.xAuth.clientSecret,
          redirect_uri: config.authProviders.xAuth.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      userId = 'x_user_id';
      console.log('X OAuth token response:', tokenResponse.data);

    } else if (service === 'discord') {
      console.log('Connecting Discord service...');
      tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: config.services.discord.clientId,
          client_secret: config.services.discord.clientSecret,
          redirect_uri: config.services.discord.redirectUri,
          grant_type: 'authorization_code',
          code,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;
      
      const userInfoResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      userId = userInfoResponse.data.id;
      console.log('Discord OAuth token response:', tokenResponse.data);

    } else if (service === 'box') {
      console.log('Connecting Box service...');
      tokenResponse = await axios.post(
        'https://api.box.com/oauth2/token',
        new URLSearchParams({
          code,
          client_id: config.services.box.clientId,
          client_secret: config.services.box.clientSecret,
          redirect_uri: config.services.box.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresIn = tokenResponse.data.expires_in;

      const userInfoResponse = await axios.get('https://api.box.com/2.0/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      userId = 'box_user_id';
      console.log('Box OAuth token response:', tokenResponse.data);
      console.log('Box User ID:', userId);

    } else {
      console.error('Unknown service in OAuth callback');
      return res.status(400).send('Unknown service');
    }

    if (!userId) {
      console.error('User ID missing in decoded token');
      return res.status(400).send('User ID missing in token');
    }

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const tokenData = { accessToken, refreshToken };
    if (expiresIn) {
      tokenData.expiresAt = new Date(Date.now() + expiresIn * 1000);
    }
    await UserToken.findOneAndUpdate(
      { userId, service },
      tokenData,
      { upsert: true, new: true }
    );

    console.log(`Tokens stored for service: ${service}, user: ${userId}`);

    console.log(`Client :${client}`);
    if (client) {
      res.redirect(`mobileclient://service?connected=${service}`);
    } else {
      res.redirect(`http://localhost:8081/services?connected=${service}`);
    }
  } catch (error) {
    console.error('Error during OAuth callback:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Service OAuth failed', error: error.message });
  }
});

module.exports = router;
module.exports.refreshToken = refreshToken;
