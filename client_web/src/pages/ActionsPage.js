import React, { useState, useEffect } from 'react';
import gmailIcon from '../Assets/gmail-icon.png';
import teamsIcon from '../Assets/teams-icon.png';
import spotifyIcon from '../Assets/spotifyIcon.png';
import discordIcon from '../Assets/discordIcon.png';
import githubIcon from '../Assets/github_logo.png';
import boxIcon from '../Assets/boxIcon.png';
import NavBar from './navBar';
import '../styles/Action.css';
import axios from 'axios';

const ActionPage = () => {
  const userId = localStorage.getItem('userId');
  const [subscriptions, setSubscriptions] = useState({});
  const [userServices, setUserServices] = useState([]);
  const [playlistName, setPlaylistName] = useState({});
  const [singerName, setSingerName] = useState({});
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [applets, setApplets] = useState([
    {
      services: ['Gmail', 'Teams'],
      description: 'Send a Teams message when an email with an attachment is received in Gmail.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: 'gmail_teams_action',
    },
    {
      services: ['Gmail', 'Teams'],
      description: 'Send a Teams message when an email matching specific filters (sender, subject) is received in Gmail.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: 'filtered_gmail_teams_notification',
      filters: { from: '', subject: '', keywords: '' }
    },
    {
      services: ['Gmail', 'Teams'],
      description: 'Send a Teams message when all emails from a specific sender.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: 'filtered_email_notification',
      filters: { specificSenderEmail: '' }
    },
    {
      services: ['Gmail', 'Teams'],
      description: 'Display the list of mail adresses from 100 last mails in Gmail in a Teams message.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: '1',
    },
    {
      services: ['Gmail', 'Teams'],
      description: 'If an email with the keyword "Urgent" in the subject is received automatically start a meeting in Microsoft Teams with the necessary participants.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: '2',
    },
    {
      services: ['Gmail', 'Teams'],
      description: 'Reception of an email with a “report” type file (Excel or PDF file). Automatically share the file in a Teams channel and notify channel members.',
      logo1: gmailIcon,
      logo2: teamsIcon,
      actionName: '3',
    },
    {
      services: ['Spotify', 'Discord'],
      description: 'Send a Discord message when a song is played on Spotify.',
      logo1: spotifyIcon,
      logo2: discordIcon,
      actionName: 'spotify_discord_action',
    },
    {
      services: ['Spotify', 'Discord'],
      description: 'Display the list of songs in Spotify playlist in a Discord message when you do the command /playlist "name of the playlist".',
      logo1: spotifyIcon,
      logo2: discordIcon,
      actionName: '5',
      playlistName: ''
    },
    {
      services: ['Spotify', 'Discord'],
      description: 'When you likes a song on Spotify. Share a message in Discord with a link to the song to invite other members to listen to it.',
      logo1: spotifyIcon,
      logo2: discordIcon,
      actionName: '6',
    },
    {
      services: ['Spotify', 'Discord'],
      description: 'Displays the most listened artists on spotify by you in a discord message.',
      logo1: spotifyIcon,
      logo2: discordIcon,
      actionName: '7',
    },
    {
      services: ['Spotify', 'Discord'],
      description: 'Displays all the songs of an artist in a teams conversation when you do /artist “artist name”',
      logo1: spotifyIcon,
      logo2: discordIcon,
      actionName: '8',
      singerName: ''
    },
    {
      services: ['Box', 'Github'],
      description: 'display all the files of the box folder in a github issues in repository.',
      logo1: boxIcon,
      logo2: githubIcon,
      actionName: '9',
    },
    {
      services: ['Box', 'Github'],
      description: 'If the file is a readme, it is autamatically added to the github repository.',
      logo1: boxIcon,
      logo2: githubIcon,
      actionName: '10',
    },
    {
      services: ['Box', 'Github'],
      description: 'A file is deleted from Box. Send a notification to the corresponding GitHub repository.',
      logo1: boxIcon,
      logo2: githubIcon,
      actionName: '11',
    },
    {
      services: ['Box', 'Github'],
      description: 'if a file is uploaded to a specific folder in Box, create a new issue in the corresponding GitHub repository.',
      logo1: boxIcon,
      logo2: githubIcon,
      actionName: '12',
    },
    {
      services: ['Box', 'Github'],
      description: 'if a folder is present in box, he is pushed on github repository.',
      logo1: boxIcon,
      logo2: githubIcon,
      actionName: '13',
    },
  ]);

  const fetchSubscribedServices = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:8080/services/subscribed-services', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUserServices(response.data);
      console.log('Subscribed services:', response.data);
    } catch (error) {
      console.error('Error fetching subscribed services:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/actions/subscriptions/${userId}`);
      const subscriptionMap = response.data.reduce((acc, subscription) => {
        acc[subscription.actionName] = subscription;
  
        if (subscription.actionName === 'filtered_gmail_teams_notification') {
          const appletIndex = applets.findIndex(a => a.actionName === 'filtered_gmail_teams_notification');
          if (appletIndex !== -1) {
            setApplets(prevApplets =>
              prevApplets.map((a, idx) =>
                idx === appletIndex ? { ...a, filters: subscription.filters || a.filters } : a
              )
            );
          }
        }
  
        return acc;
      }, {});
      setSubscriptions(subscriptionMap);
      console.log('Updated subscriptions:', subscriptionMap);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };
  
  

  useEffect(() => {
    if (userId) {
      fetchSubscriptions();
      fetchSubscribedServices();
    }
  }, [userId]);

  const hasRequiredServices = (requiredServices) => {
    const subscribedServiceNames = userServices.map(service => service.service_id?.name);
    return requiredServices.every(service => subscribedServiceNames.includes(service));
  };

  const handleSubscribe = async (applet) => {
    try {
      const data = { 
        userId, 
        actionName: applet.actionName,
        filters: applet.filters,
        playlistName: applet.actionName === '5' ? playlistName : null,
        singerName: applet.actionName === '8' ? singerName : null

      };

      await axios.post('http://localhost:8080/actions/subscribe', data);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  }; 

  const handleUnsubscribe = async (actionName) => {
    try {
      await axios.post('http://localhost:8080/actions/unsubscribe', { userId, actionName });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const handleFilterChange = (event, applet) => {
    const { name, value } = event.target;
  
    const newValue = name === 'keywords' ? value.split(' ') : value; 
  
    setApplets(prevApplets =>
      prevApplets.map(a =>
        a.actionName === applet.actionName
          ? { ...a, filters: { ...a.filters, [name]: newValue } }
          : a
      )
    );
    const updatedFilters = { ...applet.filters, [name]: newValue };
    axios.post('http://localhost:8080/actions/update-filters', {
      userId,
      actionName: applet.actionName,
      filters: updatedFilters
    })
    .then(response => {
      console.log('Filters updated successfully:', response.data);
    })
    .catch(error => {
      console.error('Error updating filters:', error);
    });
  };
  

  return (
    <div className="services-page">
      <NavBar />
      <h1>Connected services</h1>
      <div className="applets-list">
        {applets.map((applet, index) => {
          const isSubscribed = subscriptions[applet.actionName]?.isActive;
          const isFilteredGmailTeams = applet.actionName === 'filtered_gmail_teams_notification';

          if (!hasRequiredServices(applet.services)) {
            return null; 
          }

          return (
            <div key={index} className="applet-card">
              <div className="applet-logos">
                <img src={applet.logo1} alt={applet.services[0]} className="service-logo" />
                <img src={applet.logo2} alt={applet.services[1]} className="service-logo" />
              </div>
              <p className="applet-description">{applet.description}</p>

              {isFilteredGmailTeams && (
                <>
                  <button
                    className="action-button configure-filters"
                    onClick={() => setShowFilterForm(prevShow => !prevShow)}
                  >
                    {isSubscribed ? 'Modify Filters' : 'Configure Filters'}
                  </button>

                  {showFilterForm && ( 
                    <div className="filter-form">
                      <h4>Configure Filters for {applet.actionName}</h4>
                      <div className="form-group">
                        <label>From (Email):</label>
                        <input
                          type="email"
                          name="from"
                          value={applet.filters.from} 
                          onChange={(e) => handleFilterChange(e, applet)}
                          placeholder="e.g. example@gmail.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Subject:</label>
                        <input
                          type="text"
                          name="subject"
                          value={applet.filters.subject} 
                          onChange={(e) => handleFilterChange(e, applet)}
                          placeholder="e.g. Project Update"
                        />
                      </div>
                      <div className="form-group">
                        <label>Keywords (comma-separated):</label>
                        <input
                          type="text"
                          name="keywords"
                          value={applet.filters.keywords}
                          onChange={(e) => handleFilterChange(e, applet)}
                          placeholder="e.g. urgent, invoice"
                        />
                      </div>
                      <button onClick={() => setShowFilterForm(false)}>Close</button>
                    </div>
                  )}
                </>
              )}
              {
                applet.actionName === 'filtered_email_notification' && (
                  <>
                    <div className="form-group">
                      <label>Specific Sender Email:</label>
                      <input
                        type="email"
                        name="from"
                        value={applet.filters.from} 
                        onChange={(e) => handleFilterChange(e, applet)}
                        placeholder="e.g. sender@example.com"
                      />
                    </div>
                  </>
                )
              }
              {applet.actionName === '5' && (
                <div className="form-group">
                  <label>Nom de la Playlist :</label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Entrez le nom de la playlist"
                  />
                </div>
              )}
              {applet.actionName === '8' && (
                <div className="form-group">
                  <label>Nom de l'artiste :</label>
                  <input
                    type="text"
                    value={singerName}
                    onChange={(e) => setSingerName(e.target.value)}
                    placeholder="Entrez le nom de l'artiste"
                  />
                </div>
              )}
              <button
                className={`action-button ${isSubscribed ? 'deactivate' : ''}`}
                onClick={() => {
                  if (isSubscribed) {
                    handleUnsubscribe(applet.actionName);
                  } else {
                    handleSubscribe(applet);
                  }
                }}
              >
                {isSubscribed ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );  
};

export default ActionPage;