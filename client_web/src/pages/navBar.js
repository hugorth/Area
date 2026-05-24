import React, { useContext } from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../Context/ThemeContext';
import areaLogo from './../Assets/area_logo.png';

/**
 * @returns {JSX.Element} The rendered navigation bar component.
 */
const NavBar = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
        boxShadow: 'none',
        width: '100%',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', height: '80px', padding: '0 16px' }}>
        <img src={areaLogo} alt="Area Logo" className="navbar-logo" />
        <Box>
          <Button
            color="inherit"
            onClick={() => navigate('/profile')}
            sx={{ color: darkMode ? '#ffffff' : '#333', borderRadius: '20px', mr: 2 }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/services')}
            sx={{ color: darkMode ? '#ffffff' : '#333', borderRadius: '20px', mr: 2 }}
          >
            Services
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/actions')}
            sx={{ color: darkMode ? '#ffffff' : '#333', borderRadius: '20px', mr: 2 }}
          >
            Actions
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/create')}
            sx={{ color: darkMode ? '#ffffff' : '#333', borderRadius: '20px', mr: 2 }}
          >
            Create
          </Button>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ color: darkMode ? '#ffffff' : '#333', borderRadius: '20px' }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;