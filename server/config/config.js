require('dotenv').config();

const config = {
    authProviders: {
        googleAuth: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_AUTH_REDIRECT_URI,
        },
        githubAuth: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            redirectUri: process.env.GITHUB_AUTH_REDIRECT_URI,
        },
        microsoftAuth: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_AUTH_TENANT_ID,
            redirectUri: process.env.MICROSOFT_AUTH_REDIRECT_URI,
        }
    },

    services: {
        gmail: {
            clientId: process.env.GMAIL_SERVICE_CLIENT_ID,
            clientSecret: process.env.GMAIL_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.GMAIL_SERVICE_REDIRECT_URI,
            scopes: [
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify'
            ]
        },
        teams: {
            clientId: process.env.TEAMS_SERVICE_CLIENT_ID,
            clientSecret: process.env.TEAMS_SERVICE_CLIENT_SECRET,
            tenantId: process.env.TEAMS_SERVICE_TENANT_ID,
            redirectUri: process.env.TEAMS_SERVICE_REDIRECT_URI,
            scopes: [
                'Team.ReadBasic.All',
                'ChannelMessage.Read.All',
                'ChannelMessage.Send'
            ]
        },
        dropbox: {
            clientId: process.env.DROPBOX_SERVICE_CLIENT_ID,
            clientSecret: process.env.DROPBOX_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.DROPBOX_SERVICE_REDIRECT_URI,
            scopes: [
                'files.metadata.read',
                'files.content.read'
            ]
        },
        github: {
            clientId: process.env.GITHUB_SERVICE_CLIENT_ID,
            clientSecret: process.env.GITHUB_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.GITHUB_SERVICE_REDIRECT_URI,
            scopes: [
                'user:email',
                'repo'
            ]
        },
        spotifyAuth: {
            clientId: process.env.SPOTIFY_SERVICE_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.SPOTIFY_SERVICE_REDIRECT_URI,
        },
        xAuth: {
            clientId: process.env.X_SERVICE_CLIENT_ID,
            clientSecret: process.env.X_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.X_SERVICE_REDIRECT_URI,
        },
        discord: {
            clientId: process.env.DISCORD_SERVICE_CLIENT_ID,
            clientSecret: process.env.DISCORD_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.DISCORD_SERVICE_REDIRECT_URI,
            botToken: process.env.DISCORD_BOT_TOKEN,
        },
        box: {
            clientId: process.env.BOX_SERVICE_CLIENT_ID,
            clientSecret: process.env.BOX_SERVICE_CLIENT_SECRET,
            redirectUri: process.env.BOX_SERVICE_REDIRECT_URI,
        }
    },

    app: {
        port: process.env.APP_PORT || 8080,
    },

    db: {
        url: process.env.MONGO_URL || `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`,
    },

    jwt: {
        secret: process.env.JWT_SECRET,
    }
};

module.exports = config;
