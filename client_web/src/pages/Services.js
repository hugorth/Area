import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Services.css';
import gmailIcon from '../Assets/gmail-icon.png';
import teamsIcon from '../Assets/teams-icon.png';
import githubIcon from '../Assets/github_logo.png';
import NavBar from './navBar';
import dropboxIcon from '../Assets/dropboxIcon.png';
import spotifyIcon from '../Assets/spotifyIcon.png';
import discordIcon from '../Assets/discordIcon.png';
import boxIcon from '../Assets/boxIcon.png';
import xIcon from '../Assets/xIcon.png';

/**
 * The `Services` component is responsible for displaying a list of available services
 * and allowing the user to subscribe or unsubscribe to these services. It handles OAuth
 * login flows for various services and manages the state of subscribed services.
 *
 * @component
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * <Services />
 *
 * @description
 * This component fetches the list of available services and the user's subscribed services
 * from the backend. It provides buttons for subscribing and unsubscribing to services,
 * and handles OAuth login flows for Gmail, Microsoft Teams, Github, Dropbox, Spotify, and X.
 *
 * @function
 * @name Services
 *
 * @requires axios
 * @requires react
 * @requires react-router-dom
 * @requires ../styles/Services.css
 * @requires ../Assets/gmail-icon.png
 * @requires ../Assets/teams-icon.png
 * @requires ../Assets/github_logo.png
 * @requires ./navBar
 * @requires ../Assets/dropboxIcon.png
 * @requires ../Assets/spotifyIcon.png
 * @requires ../Assets/xIcon.png
 *
 * @property {Array} services - The list of available services.
 * @property {Array} subscribedServices - The list of services the user is subscribed to.
 * @property {string} authToken - The authentication token retrieved from localStorage.
 *
 * @method handleGoToProfile - Navigates to the user's profile page.
 * @method fetchSubscribedServices - Fetches the list of subscribed services from the backend.
 * @method handleGmailLogin - Initiates the OAuth login flow for Gmail.
 * @method handleTeamsLogin - Initiates the OAuth login flow for Microsoft Teams.
 * @method handleGithubLogin - Initiates the OAuth login flow for Github.
 * @method handleDropboxLogin - Initiates the OAuth login flow for Dropbox.
 * @method handleSpotifyLogin - Initiates the OAuth login flow for Spotify.
 * @method handleXLogin - Initiates the OAuth login flow for X.
 * @method getServiceIcon - Returns the icon for a given service name.
 * @method handleSubscribe - Subscribes the user to a service.
 * @method handleUnsubscribe - Unsubscribes the user from a service.
 * @method isSubscribed - Checks if the user is subscribed to a service.
 * @method handleLogin - Handles the login flow for a given service name.
 * @method renderSubscribeButton - Renders the subscribe/unsubscribe button for a service.
 */
const Services = () => {
  const [services, setServices] = useState([]);
  const [subscribedServices, setSubscribedServices] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const microsoftAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  const githubAuthUrl = 'https://github.com/login/oauth/authorize';
  const dropboxAuthUrl = 'https://www.dropbox.com/oauth2/authorize';
  const spotifyAuthUrl = 'https://accounts.spotify.com/authorize';
  const xAuthUrl = 'https://twitter.com/i/oauth2/authorize';
  const discordAuthUrl = 'https://discord.com/api/oauth2/authorize';
  const boxAuthUrl = 'https://account.box.com/api/oauth2/authorize';

  const redirectUri = 'http://localhost:8080/auth/services/callback';
  const XredirectUri = 'https://6002-90-91-152-27.ngrok-free.app/auth/services/callback';

  const googleClientId = '450898480879-jm54463f5minitf0evll8rs78omfqf9e.apps.googleusercontent.com';
  const microsoftClientId = '28b53075-2819-4c4a-a2d2-4109b2485eb8';
  const githubClientId = 'Ov23liRwqjveTsdbXa3E';
  const dropboxClientId = 'xkmcj5kt7e149cr';
  const spotifyClientId = '558845c7977743e4acabf7832e0457db';
  const xClientId = 'S1JheEh6ZmZhVktpOHNXM21BQ0w6MTpjaQ';
  const discordClientId = '1297152435499962388';
  const boxClientId = 'bsef5p845t6suou91gg1zqcdk04la0b7';
  
  const authToken = localStorage.getItem('token');

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const fetchSubscribedServices = async () => {
    try {
      const response = await axios.get('http://localhost:8080/services/subscribed-services', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setSubscribedServices(response.data);
    } catch (error) {
      console.error("Error fetching subscribed services:", error);
    }
  };

  const handleGmailLogin = () => {
    const url = `${googleAuthUrl}?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email&state=gmail&prompt=consent`;
    window.location.href = url;
  };

  const handleTeamsLogin = () => {
    const url = `${microsoftAuthUrl}?client_id=${microsoftClientId}&redirect_uri=${redirectUri}&response_type=code&scope=user.read&state=teams`;
    window.location.href = url;
  };

  const handleGithubLogin = () => {
    const scopes = 'repo user';
    const url = `${githubAuthUrl}?client_id=${githubClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scopes)}&state=github`;
    window.location.href = url;
  };

  const handleDropboxLogin = () => {
    const url = `${dropboxAuthUrl}?client_id=${dropboxClientId}&redirect_uri=${redirectUri}&response_type=code&state=dropbox`;
    window.location.href = url;
  };

  const handleSpotifyLogin = () => {
    const scopes = 'user-read-currently-playing user-read-playback-state user-library-read user-top-read';
    const url = `${spotifyAuthUrl}?client_id=${spotifyClientId}&redirect_uri=${redirectUri}&response_type=code&state=spotify&scope=${encodeURIComponent(scopes)}`;
    window.location.href = url;
  };

  const handleXLogin = () => {
    const url = `${xAuthUrl}?client_id=${xClientId}&redirect_uri=${XredirectUri}&response_type=code&state=x`;
    window.location.href = url;
  };

  const handleDiscordLogin = () => {
    const url = `${discordAuthUrl}?client_id=${discordClientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify email&state=discord`;
    window.location.href = url;
  };

  const handleBoxLogin = () => {
    const url = `${boxAuthUrl}?client_id=${boxClientId}&redirect_uri=${redirectUri}&response_type=code&state=box`;
    window.location.href = url;
  };

  const getServiceIcon = (serviceName) => {
    switch (serviceName) {
      case 'Gmail':
        return gmailIcon;
      case 'Teams':
        return teamsIcon;
      case 'DropBox':
        return dropboxIcon;
      case 'Github':
        return githubIcon;
      case 'Spotify':
        return spotifyIcon;
      case 'X':
        return xIcon;
      case 'Discord':
        return discordIcon;
      case 'Box':
        return boxIcon;
      default:
        return null;
    }
  };

  const getServiceClass = (serviceName) => {
    switch (serviceName) {
      case 'Gmail':
        return 'gmail-card';
      case 'Teams':
        return 'teams-card';
      case 'DropBox':
        return 'dropbox-card';
      case 'Github':
        return 'github-card';
      case 'Spotify':
        return 'spotify-card';
      case 'X':
        return 'x-card';
      case 'Discord':
        return 'discord-card';
      case 'Box':
        return 'box-card';
      default:
        return '';
    }
  };

  useEffect(() => {
    axios.get('http://localhost:8080/services')
      .then(response => {
        setServices(response.data);
      })
      .catch(error => {
        console.error("Error fetching services:", error);
      });

    if (authToken) {
      fetchSubscribedServices();
    }
  }, [authToken]);

  const handleSubscribe = async (serviceId) => {
    try {
      const response = await axios.post('http://localhost:8080/services/subscribe', {
        service_id: serviceId,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('Subscription successful:', response.data);
      fetchSubscribedServices();
    } catch (error) {
      console.error('Error subscribing to service:', error.response ? error.response.data : error.message);
    }
  };

  const handleUnsubscribe = async (serviceId) => {
    try {
      const response = await axios.post('http://localhost:8080/services/unsubscribe', {
        service_id: serviceId
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
  
      console.log('Unsubscription successful:', response.data);
      fetchSubscribedServices();
    } catch (error) {
      console.error('Error unsubscribing from service:', error.response ? error.response.data : error.message);
    }
  };

  const isSubscribed = (serviceId) => {
    return subscribedServices.some(subscribedService => 
      subscribedService.service_id === serviceId || 
      subscribedService.service_id._id === serviceId
    );
  };

  const handleLogin = (serviceName) => {
    switch (serviceName) {
      case 'Gmail':
        handleGmailLogin();
        break;
      case 'Teams':
        handleTeamsLogin();
        break;
      case 'Github':
        handleGithubLogin();
        break;
      case 'DropBox':
        handleDropboxLogin();
        break;
      case 'Spotify':
        handleSpotifyLogin();
        break;
      case 'X':
        handleXLogin();
        break;
      case 'Discord':
        handleDiscordLogin();
        break;
      case 'Box':
        handleBoxLogin();
        break;
      default:
        console.error(`Service login for ${serviceName} not implemented`);
    }
  };

  const renderSubscribeButton = (service) => {
    const subscribed = isSubscribed(service._id);
    return subscribed ? (
      <button className="unsubscribe-button" onClick={() => handleUnsubscribe(service._id)}>
        Unsubscribe
      </button>
    ) : (
      <button className="oauth-button" onClick={() => handleLogin(service.name)}>
        Subscribe
      </button>
    );
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    const state = queryParams.get('state');
    const connected = queryParams.get('connected');

    console.log('Code:', code);
    console.log('State:', state);
    console.log('Connected:', connected);
    console.log('Services:', services);
  
    if (code && state) {
      const service = services.find(service => service.name.toLowerCase() === state);
      if (service) {
        console.log("Service trouvé:", service);
        handleSubscribe(service._id);
      } else {
        console.log("Aucun service trouvé pour l'état:", state);
      }
    } else if (connected) {
      const service = services.find(service => service.name.toLowerCase() === connected);
      if (service) {
        console.log(`Connecté avec succès à ${connected}`);
        handleSubscribe(service._id);
      } else {
        console.log("Aucun service trouvé pour la connexion:", connected);
      }
    }
  }, [location, services]);

  return (
    <div>
      <NavBar/>
      <div className="services-page">
        <button className="back-button" onClick={handleGoToProfile}>
          Back
        </button>
        <h1>Available Services</h1>
        <div className="services-list">
          {services.map(service => (
            <div
              key={service._id}
              className={`service-card ${getServiceClass(service.name)}`}
            >
              <img
                src={getServiceIcon(service.name)}
                alt={service.name}
                className="service-icon"
              />
              <h3>{service.name}</h3>
              {renderSubscribeButton(service)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;