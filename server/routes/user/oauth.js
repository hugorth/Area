const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const User = require('../../models/User');
const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    console.error('No code received in the callback request.');
    return res.status(400).send('Authentication failed: No authorization code received.');
  }

  const client = req.headers[`sec-ch-ua-platform`];
  const provider = state || 'google';
  console.log('OAuth callback initiated. Code:', code, 'State (provider):', provider);

  try {
    let tokenResponse;

    if (provider === 'google') {
      console.log('Requesting Google OAuth token...');
      tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: config.authProviders.googleAuth.clientId,
          client_secret: config.authProviders.googleAuth.clientSecret,
          redirect_uri: config.authProviders.googleAuth.redirectUri,
          grant_type: 'authorization_code',
        },
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      console.log('Google OAuth token response:', tokenResponse.data);
    } else if (provider === 'github') {
      console.log('Requesting GitHub OAuth token...');
      tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        new URLSearchParams({
          code,
          client_id: config.authProviders.githubAuth.clientId,
          client_secret: config.authProviders.githubAuth.clientSecret,
          redirect_uri: config.authProviders.githubAuth.redirectUri,
        }).toString(),
        { 
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
        }
      );
      console.log('GitHub OAuth token response:', tokenResponse.data);
    } else if (provider === 'microsoft') {
      console.log('Requesting Microsoft OAuth token...');
      tokenResponse = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          code,
          client_id: config.authProviders.microsoftAuth.clientId,
          client_secret: config.authProviders.microsoftAuth.clientSecret,
          redirect_uri: config.authProviders.microsoftAuth.redirectUri,
          grant_type: 'authorization_code',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('Microsoft OAuth token response:', tokenResponse.data);
    }

    const accessToken = tokenResponse.data.access_token;
    console.log('Access token received:', accessToken);
    let userInfo;

    if (provider === 'google') {
      console.log('Requesting Google user info...');
      userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('Google user info response:', userInfo.data);
    } else if (provider === 'github') {
      console.log('Requesting GitHub user info...');
      userInfo = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('GitHub user info response:', userInfo.data);

      if (!userInfo.data.email) {
        console.log('Requesting GitHub user emails...');
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const primaryEmail = emailResponse.data.find(email => email.primary && email.verified);
        if (primaryEmail) {
          userInfo.data.email = primaryEmail.email;
        } else {
          console.error('No primary verified email found for GitHub account');
          return res.status(400).send('Authentication failed: No primary verified email found');
        }
      }
    } else if (provider === 'microsoft') {
      userInfo = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    let user = await User.findOne({ email: userInfo.data.email || userInfo.data.userPrincipalName });
    if (!user) {
      user = new User({
        email: userInfo.data.email || userInfo.data.userPrincipalName,
        firstName: userInfo.data.givenName || userInfo.data.first_name || '',
        lastName: userInfo.data.surname || userInfo.data.family_name || '',
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, config.jwt.secret, { expiresIn: '1h' });
    
    if (client)
      res.redirect(`mobileclient://login?token=${token}&userId=${user._id}`);
    else
      res.redirect(`http://localhost:8081/profile?token=${token}&userId=${user._id}`);
  } catch (error) {
    console.error('Error during OAuth callback:', error.response ? error.response.data : error.message);
    return res.status(500).send('Authentication failed');
  }
});

module.exports = router;
