import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Services from './pages/Services';
import PrivateRoute from './components/PrivateRoute';
import ChangePassword from './pages/ChangePassword';
import ActionPage from './pages/ActionsPage';
import { ThemeContext } from './Context/ThemeContext';
import Create from './pages/Create';
import DarkModeToggle from './components/DarkModeToggle';


/**
 * App component that sets up the main routing for the application.
 * 
 * This component uses React Router to define routes for different pages of the application.
 * It includes both public routes (login and register) and private routes (profile, services, change password, and actions).
 * Private routes are wrapped with the `PrivateRoute` component to ensure that only authenticated users can access them.
 * 
 * @component
 * @example
 * return (
 *   <App />
 * )
 */

const App = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  return (
    <Router>
      <div className={darkMode ? 'dark-mode' : ''}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <Services />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
          <Route
            path="/actions"
            element={
              <PrivateRoute>
                <ActionPage />
              </PrivateRoute>
            }
          />
          <Route
              path="/create"
              element={
                <PrivateRoute>
                  <Create />
                </PrivateRoute>
              }
            />
          </Routes>
      </div>
    </Router>
  );
};

export default App;