import React from 'react';
import { FormControlLabel, Switch } from '@mui/material';

/**
 * DarkModeToggle component that provides a switch to toggle between dark mode and light mode.
 * 
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.darkMode - The current state of dark mode.
 * @param {function} props.setDarkMode - The function to toggle dark mode.
 * 
 * @returns {JSX.Element} The rendered DarkModeToggle component.
 */
const DarkModeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <FormControlLabel
      control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
      label={darkMode ? 'Light Mode' : 'Dark Mode'}
      sx={{ mt: 2, align: 'right' }}
    />
  );
};

export default DarkModeToggle;