import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box,
  Alert 
} from '@mui/material';
import NavBar from './navBar'

/**
 * ChangePassword component allows users to change their password.
 * It includes form fields for the current password, new password, and confirmation of the new password.
 * It also handles form submission and displays success or error messages.
 *
 * @component
 * @example
 * return (
 *   <ChangePassword />
 * )
 */
const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const navigate = useNavigate();

  /**
 * Handles changes to the form fields and updates the formData state.
 *
 * @function
 * @param {Object} e - The event object from the input field.
 */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
 * Handles form submission to change the user's password.
 * It validates the form data, sends a request to the server, and handles the response.
 *
 * @async
 * @function
 * @param {Object} e - The event object from the form submission.
 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setPasswordSuccess('Mot de passe modifié avec succès.');
        setFormData({ 
          currentPassword: '',
          newPassword: '',
          confirmPassword: '' 
        });
        navigate('/profile'); 
      } else {
        const errorDetails = await response.json();
        setPasswordError(errorDetails.message || 'Erreur lors de la modification du mot de passe.');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe :', error);
      setPasswordError('Erreur lors de la modification du mot de passe.');
    }
  };
  return (
    <div className="change-password">
    <NavBar />
    <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px' }}>
      <Typography component="h1" variant="h5">
        Change Password
      </Typography>
      {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}
      {passwordError && <Alert severity="error">{passwordError}</Alert>}
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, borderRadius: '60px'}}>
        <TextField
          margin="normal"
          required
          fullWidth
          name="currentPassword"
          label="Current Password"
          type="password"
          id="currentPassword"
          autoComplete="current-password"
          value={formData.currentPassword}
          onChange={handleChange}
          sx={{ borderRadius: '10px' }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          label="New Password"
          type="password"
          id="newPassword"
          autoComplete="new-password"
          value={formData.newPassword}
          onChange={handleChange}
          sx={{ borderRadius: '10px' }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          sx={{ borderRadius: '10px' }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Change Password
        </Button>
      </Box>
    </Box>
    </div>
  );
};

export default ChangePassword;