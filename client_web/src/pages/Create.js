import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './navBar';
import gmailIcon from '../Assets/gmail-icon.png';
import teamsIcon from '../Assets/teams-icon.png';
import spotifyIcon from '../Assets/spotifyIcon.png';
import discordIcon from '../Assets/discordIcon.png';
import githubIcon from '../Assets/github_logo.png';
import boxIcon from '../Assets/boxIcon.png';
import '../styles/Create.css';
import axios from 'axios';
import DarkModeToggle from '../components/DarkModeToggle';
import { ThemeContext } from '../Context/ThemeContext';

function Create() {
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [savedAutomations, setSavedAutomations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchSavedAutomations = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/saved-automations?userId=${userId}`);
        setSavedAutomations(response.data);
      } catch (error) {
        console.error('Error fetching saved automations:', error);
      }
    };
    fetchSavedAutomations();
  }, [userId]);
  

  const handleBackClick = () => {
    navigate('/profile');
  };

  const actions = [
    {
      services: 'gmail',
      description: 'Receive an email with a specific keyword',
      logo1: gmailIcon,
      actionName: 'gmail_receive_email_with_keyword',
    },
    {
      services: 'github',
      description: 'New commit in a repository',
      logo1: githubIcon,
      actionName: 'github_new_commit',
    },
    {
      services: 'spotify',
      description: 'Song added to a playlist',
      logo1: spotifyIcon,
      actionName: 'spotify_new_song_added_to_playlist',
    },
    {
      services: 'teams',
      description: 'New message in a channel',
      logo1: teamsIcon,
      actionName: 'teams_new_message_in_channel',
    },
    {
      services: 'box',
      description: 'New file added to a folder',
      logo1: boxIcon,
      actionName: 'box_new_file_added_to_folder',
    }
  ];

  const reactions = [
    {
      services: 'discord',
      description: 'Send a message in a channel',
      logo1: discordIcon,
      reactionName: 'discord_send_message_in_channel',
    },
    {
      services: 'teams',
      description: 'Create an event in the calendar',
      logo1: teamsIcon,
      reactionName: 'teams_create_event_in_calendar',
    },
    {
      services: 'gmail',
      description: 'Send notification email',
      logo1: gmailIcon,
      reactionName: 'gmail_send_notification_email',
    },
    {
      services: 'box',
      description: 'Save a file',
      logo1: boxIcon,
      reactionName: 'box_save_file',
    },
    {
      services: 'github',
      description: 'Add a comment to an issue',
      logo1: githubIcon,
      reactionName: 'github_add_comment_to_issue',
    }
  ];

  const handleSelection = (item) => {
    if (selectedType === 'action') {
      setSelectedAction(item);
      setSelectedType(null);
    } else if (selectedType === 'reaction') {
      setSelectedReaction(item);
      setSelectedType(null);
    }
  };

  const handleDeleteAutomation = async (id, index) => {
    try {
      await axios.delete(`http://localhost:8080/api/saved-automations/${id}`);
      const updatedAutomations = savedAutomations.filter((_, i) => i !== index);
      setSavedAutomations(updatedAutomations);
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };
  

  const handleSaveAutomation = async () => {
    const isDuplicate = savedAutomations.some(
      (automation) =>
        automation.action.actionName === selectedAction.actionName &&
        automation.reaction.reactionName === selectedReaction.reactionName
    );
  
    if (isDuplicate) {
      alert("You cannot create duplicate action-reaction automations.");
      return;
    }
  
    const newAutomation = {
      userId,
      action: selectedAction,
      reaction: selectedReaction,
      isActive: true,
      subscribed: false,
    };
  
    try {
      const response = await axios.post('http://localhost:8080/api/saved-automations', newAutomation);
      setSavedAutomations([...savedAutomations, response.data]);
      setSelectedAction(null);
      setSelectedReaction(null);
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };
  
  const toggleActivation = async (index) => {
    const updatedAutomation = { 
      ...savedAutomations[index], 
      isActive: !savedAutomations[index].isActive 
    };

    try {
      await axios.put(`http://localhost:8080/api/saved-automations/${updatedAutomation._id}`, updatedAutomation);
      const updatedAutomations = savedAutomations.map((automation, i) =>
        i === index ? updatedAutomation : automation
      );
      setSavedAutomations(updatedAutomations);
    } catch (error) {
      console.error('Error toggling automation activation:', error);
    }
  };

  const toggleSubscription = (index) => {
    const updatedAutomation = {
      ...savedAutomations[index],
      subscribed: !savedAutomations[index].subscribed
    };

    setSavedAutomations(
      savedAutomations.map((automation, i) => 
        i === index ? updatedAutomation : automation
      )
    );
  };

  return (
    <div className={`create-page ${darkMode ? 'dark-mode' : ''}`}>
      <NavBar />
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="app-container-create">
        <button className="back-button-create" onClick={handleBackClick}>Back</button>
        <h1 className="page-title-create">Create Your Area</h1>
        <p className="usage-info-create">Choose an action and a reaction to create your customized area</p>
        
        <div className="card-container-create">
          <div className="card-create" onClick={() => setSelectedType('action')}>
            <div className="card-content-create">
              <h2 className="card-title-create">Action</h2>
              <p className="card-description-create">Choose an action that will trigger your automation.</p>
              <button className="card-button-create">
                {selectedAction ? selectedAction.description : "Select Action"}
              </button>
            </div>
          </div>
          <div className="card-create" onClick={() => setSelectedType('reaction')}>
            <div className="card-content-create">
              <h2 className="card-title-create">Reaction</h2>
              <p className="card-description-create">Choose a reaction that will respond to the action.</p>
              <button className="card-button-create">
                {selectedReaction ? selectedReaction.description : "Select Reaction"}
              </button>
            </div>
          </div>
        </div>
        
        {selectedType && (
          <div className="selection-container-create">
            <h3 className="selection-title-create">
              {selectedType === 'action' ? "Available Actions" : "Available Reactions"}
            </h3>
            <div className="selection-row-create">
              {(selectedType === 'action' ? actions : reactions).map((item, index) => (
                <div key={index} className="selection-card-create" onClick={() => handleSelection(item)}>
                  <img src={item.logo1} alt={`${item.services} logo`} className="service-logo-create" />
                  <p className="selection-description-create">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedAction && selectedReaction) && (
          <div className="new-automation-card">
            <h3 className="new-automation-title">Created Automation</h3>
            <div className="automation-card">
              <div className="automation-logos">
                <img src={selectedAction.logo1} alt={selectedAction.services} className="service-logo" />
                <img src={selectedReaction.logo1} alt={selectedReaction.services} className="service-logo" />
              </div>
              <p className="automation-description">
                {selectedAction.description} ➔ {selectedReaction.description}
              </p>
              <button className="save-button" onClick={handleSaveAutomation}>Save</button>
            </div>
          </div>
        )}

        {savedAutomations.length > 0 && (
          <div className="saved-automation-section">
            <h3 className="saved-automation-title">Saved Automations</h3>
            <div className="saved-automation-list">
            {savedAutomations.map((automation, index) => (
                <div key={automation._id} className="automation-card">
                  <div className="automation-logos">
                    <img src={automation.action.logo1} alt={automation.action.services} className="service-logo" />
                    <img src={automation.reaction.logo1} alt={automation.reaction.services} className="service-logo" />
                  </div>
                  <p className="automation-description">
                    {automation.action.description} ➔ {automation.reaction.description}
                  </p>
                  <button
                    className={`activation-button ${automation.isActive ? 'deactivate' : 'activate'}`}
                    onClick={() => toggleActivation(index)}
                  >
                    {automation.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteAutomation(automation._id, index)}>
                    Delete
                  </button>
                </div>
              ))}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Create;
