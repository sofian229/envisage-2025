import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    patientKey: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role, patientKey } = formData;

  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get('http://localhost:5000/health', { timeout: 5000 });
        setServerStatus('online');
      } catch (err) {
        console.error('Server check failed:', err);
        setServerStatus('offline');
        setError('Server appears to be offline. Please ensure the backend server is running.');
      }
    };
    
    checkServerStatus();
  }, []);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    
    // Don't attempt registration if server is offline
    if (serverStatus === 'offline') {
      setError('Cannot register: Server is offline. Please start the backend server.');
      return;
    }
    
    // Validate form
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate that guardian/doctor has a patient key
    if ((role === 'guardian' || role === 'doctor') && !patientKey) {
      setError(`${role === 'doctor' ? 'Doctor' : 'Guardian'} must provide a patient key`);
      return;
    }
    
    try {
      // Create request body based on role
      const requestBody = {
        name,
        email,
        password,
        role
      };
      
      // Add patientKey for guardian/doctor
      if ((role === 'guardian' || role === 'doctor') && patientKey) {
        requestBody.patientKey = patientKey;
      }
      
      console.log('Sending registration data:', requestBody);
      
      // Send registration request with timeout
      const res = await axios.post('http://localhost:5000/api/auth/register', requestBody, {
        timeout: 10000 // 10 second timeout
      });
      
      setSuccess('Registration successful! Redirecting to login...');
      
      // If patient, show their patient key
      if (role === 'patient' && res.data.patientKey) {
        setSuccess(`Registration successful! Your patient key is: ${res.data.patientKey}. Please save this key to share with your guardians. Redirecting to login...`);
      }
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Network error: Cannot connect to server. Please ensure the backend server is running at http://localhost:5000');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {serverStatus === 'checking' && <div className="alert alert-info">Checking server status...</div>}
        {serverStatus === 'offline' && <div className="alert alert-danger">Server appears to be offline. Please start the backend server.</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={role} onChange={onChange}>
              <option value="patient">Patient</option>
              <option value="guardian">Guardian</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          {(role === 'guardian' || role === 'doctor') && (
            <div className="form-group">
              <label>Patient Key</label>
              <input
                type="text"
                name="patientKey"
                value={patientKey}
                onChange={onChange}
                placeholder="Enter the patient's key"
              />
              <small>Required to link with a patient</small>
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={serverStatus === 'offline'}>Register</button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

