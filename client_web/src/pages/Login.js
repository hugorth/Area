import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './../styles/Login.css';
import areaLogo from './../Assets/area_logo.png';
import githubLogo from './../Assets/github_logo.png';
import googleLogo from './../Assets/google_logo.png';
import microsoftLogo from './../Assets/microsoft_logo.png';
import { BsEyeFill, BsEyeSlashFill } from 'react-icons/bs';

/**
 * Login component for user authentication.
 * 
 * @component
 * @returns {JSX.Element} The rendered login page component.
 * 
 * @example
 * return (
 *   <Login />
 * )
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const githubAuthUrl = 'https://github.com/login/oauth/authorize';
  const microsoftAuthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

  const googleClientId = '477262949060-994lha13s22nhk3r3etu10s4b65mv50i.apps.googleusercontent.com';
  const githubClientId = 'Ov23liSRtdTZubZbydum';
  const microsoftClientId = '6765b33e-06fe-4c44-801e-021256681b95';

  const redirectUri = 'http://localhost:8080/auth/callback';

  const handleGoogleLogin = async () => {
    console.log("Redirecting to Google OAuth");
    const url = `${googleAuthUrl}?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&state=google`;
    window.location.href = url;
  };

  const handleGithubLogin = () => {
    console.log("Redirecting to GitHub OAuth");
    const url = `${githubAuthUrl}?client_id=${githubClientId}&redirect_uri=${redirectUri}&response_type=code&scope=user:email&state=github`;
    window.location.href = url;
  };

  const handleMicrosoftLogin = () => {
    const state = 'microsoft';
    const url = `${microsoftAuthUrl}?client_id=${microsoftClientId}&redirect_uri=${redirectUri}&response_type=code&scope=user.read&state=${state}`;
    window.location.href = url;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('token', data.token);
        navigate('/profile');
      } else {
        setErrorMessage(data.message);
        showErrorPopup();
      }
    } catch (error) {
      setErrorMessage('Server error');
      showErrorPopup();
    }
  };

  const showErrorPopup = () => {
    const popup = document.getElementById('error-popup');
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <img src={areaLogo} alt="Deezer Logo" className="deezer-logo" />
      </header>
      
      <h1 className="login-title">CONNECT</h1>
      
      <form className="login-form" onSubmit={handleLogin}>
        <div className="email-container-login">
          <label htmlFor="email" className="input-label">Email</label>
          <input
            type="email"
            className="login-input"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="password-container">
          <label htmlFor="password" className="input-label">Password</label>
          <div className="password-input-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              className="login-input"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {passwordVisible ? <BsEyeFill /> : <BsEyeSlashFill />}
            </span>
          </div>
          <a href="#" className="forgot-password">Forgotten password?</a>
        </div>
        <button type="submit" className="login-button">Log in</button>
      </form>
      
      <div className="login-options">
        <span>or</span>
        <div className="social-buttons">
          <button className="social-button google" onClick={handleGoogleLogin}>
            <img src={googleLogo} alt="Google" />
          </button>
          <button className="social-button github" onClick={handleGithubLogin}>
            <img src={githubLogo} alt="Github" />
          </button>
          <button className="social-button microsoft" onClick={handleMicrosoftLogin}>
            <img src={microsoftLogo} alt="Microsoft" />
          </button>
        </div>
      </div>
      
      <p className="signup-link">
        Don't you have an account on AREA yet? <Link to="/register">Registration</Link>
      </p>

      <div id="error-popup" className="error-popup">
        <p>Error: {errorMessage}</p>
      </div>
    </div>
  );
};

export default Login;
