import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Box,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PhotoCamera, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import areaLogo from './../Assets/area_logo.png';
import './../styles/Profile.css';
import NavBar from './navBar';
import DarkModeToggle from '../components/DarkModeToggle';
import { ThemeContext } from '../Context/ThemeContext';

/**
 * Profile component that displays and allows editing of user profile information.
 * 
 * @component
 * @returns {JSX.Element} The rendered Profile component.
 * 
 * @example
 * return <Profile />
 * 
 * @description
 * This component fetches user data from the server and displays it. Users can edit their profile information,
 * including their profile picture, first name, last name, email, gender, and birthdate. The component also 
 * provides options to change the password and navigate to different sections like Actions, Reactions, and Services.
 * 
 * @function
 * @name Profile
 * 
 * @property {Object} user - The user object containing user information.
 * @property {Object} formData - The form data object containing user input values.
 * @property {boolean} isEditing - A boolean indicating if the profile is in edit mode.
 * @property {string|null} profilePicPreview - The preview URL of the profile picture.
 * @property {string|null} initialProfilePic - The initial URL of the profile picture.
 * 
 * @property {function} fetchUserData - Fetches user data from the server.
 * @property {function} handleEdit - Enables edit mode for the profile.
 * @property {function} handleCancel - Cancels edit mode and resets form data.
 * @property {function} handleSave - Saves the updated profile information to the server.
 * @property {function} handleChange - Handles changes in the form input fields.
 * @property {function} handleProfilePicChange - Handles changes in the profile picture input.
 * @property {function} handleDeleteProfilePic - Deletes the profile picture.
 * @property {function} handleChangePasswordRedirect - Redirects to the change password page.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires @mui/material
 * @requires @mui/icons-material
 * @requires ./../Assets/area_logo.png
 * @requires ./../styles/Profile.css
 * @requires ./navBar
 */
const Profile = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    identity: '',
    birthday: '',
    profilePic: null,
    deleteProfilePic: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [initialProfilePic, setInitialProfilePic] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8080/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            identity: userData.identity || '',
            birthday: userData.birthday || '',
            profilePic: null,
            deleteProfilePic: false,
          });
          const profilePicPath = `http://localhost:8080${userData.profilePic}`;
          setProfilePicPreview(profilePicPath);
          setInitialProfilePic(profilePicPath);
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData((prevFormData) => ({
      ...prevFormData,
      profilePic: user.profilePic ? user.profilePic : null,
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePic: null,
      deleteProfilePic: false,
    });
    setProfilePicPreview(initialProfilePic);
  };

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);

      if (formData.profilePic) {
        formDataToSend.append('profilePic', formData.profilePic);
      }

      const response = await fetch('http://localhost:8080/user/update', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        const newProfilePicPath = `http://localhost:8080${updatedUser.profilePic}`;
        setProfilePicPreview(newProfilePicPath);
        setInitialProfilePic(newProfilePicPath);
        // setFormData({ ...formData, profilePic: false });
      } else {
        const errorDetails = await response.json();
        console.error('Failed to update user:', errorDetails);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Profile picture change
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
        setFormData({
          ...formData,
          profilePic: file,
          deleteProfilePic: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfilePic = () => {
    setProfilePicPreview(null);
    setFormData({ ...formData, profilePic: null, deleteProfilePic: true });
  };

  const handleChangePasswordRedirect = () => {
    navigate('/change-password'); 
  };

  return (
    <div className="profile-page">
      <NavBar />
  
      <Grid container spacing={3} sx={{ p: 3, mt: 2 }} justifyContent={'center'}>
        <Grid item xs={12} md={4}>
          <Box className="profile-card" sx={{ borderRadius: '30px', p: 3, height: '100%' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={profilePicPreview || 'https://via.placeholder.com/150'}
                alt="Profile"
                sx={{ width: 150, height: 150, border: '4px solid #f5f5f5' }}
              />
              {isEditing && (
                <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profilePic"
                    type="file"
                    onChange={handleProfilePicChange}
                  />
                  <label htmlFor="profilePic">
                    <Tooltip title="Edit profile picture">
                      <IconButton color="primary" aria-label="upload picture" component="span">
                        <PhotoCamera />
                      </IconButton>
                    </Tooltip>
                  </label>
                  {profilePicPreview && (
                    <Tooltip title="Delete profile picture">
                      <IconButton color="error" aria-label="delete picture" onClick={handleDeleteProfilePic}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>
            {isEditing ? (
              <Box>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                  disabled
                />
                <TextField
                  fullWidth
                  label="Gender"
                  name="gender"
                  value={formData.indentity}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Birthdate"
                  name="birthdate"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                  {`${user.firstName} ${user.lastName}`}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  {user.email}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  {`Gender: ${user.identity}`}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  {`Birthdate: ${user.birthday ? new Date(user.birthday).toLocaleDateString() : 'N/A'}`}
                </Typography>
              </Box>
            )}
            <Box sx={{ mt: 3 }}>
              {isEditing ? (
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    sx={{ mr: 2, backgroundColor: '#00bfa5' }}
                  >
                    Save
                  </Button>
                  <Button variant="contained" onClick={handleCancel} sx={{ backgroundColor: '#f44336' }}>
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button variant="contained" onClick={handleEdit} startIcon={<EditIcon />} sx={{ backgroundColor: '#00bfa5' }}>
                  Edit Profile
                </Button>
              )}
            </Box>
  
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Change Password
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleChangePasswordRedirect}
                sx={{ backgroundColor: '#00bfa5' }}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </Grid>
  
        <Grid item xs={12} md={4} justifyContent={'center'}>
          <Box className="actions-card" sx={{ p: 3, borderRadius: '30px', height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Actions & Services
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  className="action-button"
                  fullWidth
                  onClick={() => navigate('/actions')}
                  sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '30px' }}
                >
                  Actions
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  className="action-button"
                  fullWidth
                  onClick={() => navigate('/create')}
                  sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '30px' }}
                >
                  Create
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  className="action-button"
                  fullWidth
                  onClick={() => navigate('/services')}
                  sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '30px' }}
                >
                  Services
                </Button>
                <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};  

export default Profile;