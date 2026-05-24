const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config/config");
const connectDB = require("./config/db");

const user = require("./routes/user/user");
const oauth = require('./routes/user/oauth');
const terms = require("./routes/terms/terms");
const privacy = require("./routes/terms/privacy");
const serviceAuthRoutes = require('./routes/services/authService');
const services = require("./routes/services/services");
const seedServices = require('./routes/services/seed');
const actionsRoutes = require('./routes/actions/actionsService');
const creationPage = require('./routes/actions/creationPage');
    const { runmixmatchCronJob } = require('./trigger/mixandmatchCronJob');
require('dotenv').config();

const app = express();
const port = config.app.port;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/user", user);
app.use("/auth", oauth);
app.use("/services", services);
app.use("/terms", terms);
app.use("/privacy", privacy);
app.use("/auth", serviceAuthRoutes);
app.use("/actions", actionsRoutes);
app.use('/api', creationPage);

const startApp = async () => {
    await connectDB();
    await seedServices();
    runmixmatchCronJob();
};

startApp();

app.get("/", (req, res) => {
    res.status(200).send("Welcome to the server app");
});

app.get("/about.json", (req, res) => {
    const currentTime = Math.floor(Date.now() / 1000);
        const aboutInfo = {
            client: {
                host: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            },
            server: {
                current_time: currentTime,
                services: [
                    {
                        name: "facebook",
                        actions: [
                            {
                                name: "new_message_in_group",
                                description: "A new message is posted in the group"
                            },
                            {
                                name: "new_message_inbox",
                                description: "A new private message is received by the user"
                            },
                            {
                                name: "new_like",
                                description: "The user gains a like from one of their messages"
                            }
                        ],
                        reactions: [
                            {
                                name: "like_message",
                                description: "The user likes a message"
                            }
                        ]
                    },
                    {
                        name: "gmail",
                        actions: [
                            {
                                name: "email_with_attachment",
                                description: "An email with an attachment is received"
                            },
                            {
                                name: "filtered_email_notification",
                                description: "An email from a specific sender or with specific keywords is received"
                            }
                        ],
                        reactions: [
                            {
                                name: "send_teams_message",
                                description: "Sends a message to a Teams channel when criteria are met"
                            }
                        ]
                    },
                    {
                        name: "spotify",
                        actions: [
                            {
                                name: "spotify_playing_track",
                                description: "A track is currently playing on Spotify"
                            }
                        ],
                        reactions: [
                            {
                                name: "send_discord_message",
                                description: "Sends a message to a Discord channel when a track is playing"
                            }
                        ]
                    },
                    {
                        name: "dropbox",
                        actions: [
                            {
                                name: "file_modified",
                                description: "A file is modified in Dropbox"
                            }
                        ],
                        reactions: [
                            {
                                name: "send_email_notification",
                                description: "Send an email notification when a file is modified"
                            }
                        ]
                    },
                    {
                        name: "github",
                        actions: [
                            {
                                name: "create_repo",
                                description: "Create a new repository on GitHub"
                            },
                            {
                                name: "new_issue",
                                description: "A new issue is opened in a repository"
                            },
                            {
                                name: "pull_request_opened",
                                description: "A new pull request is opened in a repository"
                            }
                        ],
                        reactions: [
                            {
                                name: "close_issue",
                                description: "Close an issue on GitHub"
                            },
                            {
                                name: "merge_pull_request",
                                description: "Merge a pull request on GitHub"
                            }
                        ]
                    },
                    {
                        name: "X",
                        actions: [
                            {
                                name: "new_tweet",
                                description: "A new tweet is posted by the user"
                            },
                            {
                                name: "new_follower",
                                description: "The user gains a new follower"
                            }
                        ],
                        reactions: [
                            {
                                name: "retweet",
                                description: "Retweet a specific tweet"
                            },
                            {
                                name: "send_direct_message",
                                description: "Send a direct message to a user"
                            }
                        ]
                    },
                    {
                        name: "discord",
                        actions: [
                            {
                                name: "send_message",
                                description: "Send a message to a Discord channel"
                            },
                            {
                                name: "receive_message",
                                description: "Receive a message from a Discord channel"
                            }
                        ],
                        reactions: [
                            {
                                name: "create_channel",
                                description: "Create a new channel in Discord"
                            },
                            {
                                name: "kick_user",
                                description: "Kick a user from the server"
                            }
                        ]
                    },
                    {
                        name: "microsoft_teams",
                        actions: [
                            {
                                name: "new_message_in_channel",
                                description: "A new message is posted in a Teams channel"
                            },
                            {
                                name: "file_uploaded",
                                description: "A file is uploaded to a Teams channel"
                            }
                        ],
                        reactions: [
                            {
                                name: "send_message",
                                description: "Send a message to a Teams channel"
                            },
                            {
                                name: "create_meeting",
                                description: "Schedule a new meeting in Teams"
                            }
                        ]
                    }
                ]
            }
        };
    
        res.json(aboutInfo);
});
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
});

app.listen(port, (error) => {
    if (error) {
        console.error("This is an error", error);
    }
    console.log(`Server is running on port ${port}`);
});