import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import areaLogo from '../Assets/area_logo.png';
import githubLogo from '../Assets/github_logo.png';
import googleLogo from '../Assets/google_logo.png';
import microsoftLogo from '../Assets/microsoft_logo.png';
import { BsEyeSlashFill, BsEyeFill } from "react-icons/bs";

/**
 * Register component handles the user registration process.
 * It includes form fields for email, password, first name, last name, birthday, and identity.
 * It also provides social login options and toggles password visibility.
 * 
 * @component
 * @example
 * return (
 *   <Register />
 * )
 * 
 * @returns {JSX.Element} The rendered component.
 * 
 * @function
 * @name Register
 * 
 * @description
 * This component manages the state for the registration form fields and handles form submission.
 * It validates the name fields to ensure they contain only letters and spaces.
 * On form submission, it sends a POST request to the server to register the user.
 * If the registration is successful, it navigates to the login page.
 * If there is an error, it displays an error message.
 * 
 * @property {boolean} passwordVisible - State to toggle password visibility.
 * @property {string} firstName - State to store the user's first name.
 * @property {string} name - State to store the user's last name.
 * @property {string} email - State to store the user's email.
 * @property {string} password - State to store the user's password.
 * @property {string} birthday - State to store the user's birthday.
 * @property {string} identity - State to store the user's identity.
 * @property {string} errorMessage - State to store error messages.
 * 
 * @method
 * @name togglePasswordVisibility
 * @description Toggles the visibility of the password field.
 * 
 * @method
 * @name validateName
 * @description Validates that the name contains only letters and spaces.
 * @param {string} value - The name value to validate.
 * @returns {boolean} True if the name is valid, false otherwise.
 * 
 * @method
 * @name handleFirstNameChange
 * @description Handles changes to the first name field and validates the input.
 * @param {object} e - The event object.
 * 
 * @method
 * @name handleNameChange
 * @description Handles changes to the last name field and validates the input.
 * @param {object} e - The event object.
 * 
 * @method
 * @name handleSubmit
 * @description Handles form submission, sends a POST request to register the user, and handles the response.
 * @param {object} e - The event object.
 */
function Register() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState('');
    const [identity, setIdentity] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };
    const validateName = (value) => /^[a-zA-Z\s]*$/.test(value);
    const handleFirstNameChange = (e) => {
        if (validateName(e.target.value)) {
            setFirstName(e.target.value);
        }
    };
    const handleNameChange = (e) => {
        if (validateName(e.target.value)) {
            setName(e.target.value);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, firstName, lastName: name, birthday, identity })
            });
            if (response.ok) {
                navigate('/login');
            } else {
                const data = await response.json();
                setErrorMessage(data.message || "An error occurred");
            }
        } catch (error) {
            setErrorMessage("Server error");
        }
    };
    return (
        <div className="register-page">
            <header className="register-header">
                <img src={areaLogo} alt="Deezer Logo" className="deezer-logo" />
            </header>
            
            <h1 className="register-title">Sign up for free</h1>
            <p className="signin-link">
                Do you already have an account? <Link to="/login">Connection</Link>
            </p>
            <div className="social-register">
                <div className="social-buttons">
                    <button className="social-button google">
                        <img src={googleLogo} alt="Google" />
                    </button>
                    <button className="social-button github">
                        <img src={githubLogo} alt="Github" />
                    </button>
                    <button className="social-button microsoft">
                        <img src={microsoftLogo} alt="Microsoft" />
                    </button>
                </div>
                <span>or</span>
            </div>
            
            <form className="register-form" onSubmit={handleSubmit}>
                <div className="email-container">
                    <label htmlFor="email" className="input-label">Email</label>
                    <input
                        type="email"
                        className="register-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <div className="email-container">
                    <label htmlFor="password" className="input-label">Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={passwordVisible ? "text" : "password"}
                            className="register-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                            {passwordVisible ? <BsEyeFill /> : <BsEyeSlashFill />}
                        </span>
                    </div>
                </div>
                
                <div className="email-container">
                    <label htmlFor="firstname" className="input-label">First Name</label>
                    <input
                        type="text"
                        className="register-input"
                        value={firstName}
                        onChange={handleFirstNameChange}
                        required
                    />
                </div>
                <div className="email-container">
                    <label htmlFor="name" className="input-label">Name</label>
                    <input
                        type="text"
                        className="register-input"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                </div>
                <div className="email-container">
                    <label htmlFor="birthday" className="input-label">Birthday</label>
                    <input
                        type="date"
                        className="register-input"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        required
                    />
                </div>
                <div className="identity-container">
                    <label htmlFor="identity" className="input-label-identity">Identity</label>
                    <select
                        className="register-input"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        required
                    >
                        <option value="">Select Identity</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                
                <button type="submit" className="register-button">Registration</button>
            </form>
        </div>
    );
}
export default Register;