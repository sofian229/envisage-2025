import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import LocationMap from '../Map/LocationMap';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { 
    isTracking, 
    trackingError, 
    wsConnected,
    startLocationTracking, 
    stopLocationTracking 
  } = useLocation();
  const [patientInfo, setPatientInfo] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingButtonDisabled, setTrackingButtonDisabled] = useState(false);
  const navigate = useNavigate();

  // Use useCallback to prevent unnecessary re-renders
  const handleStartTracking = useCallback(() => {
    setTrackingButtonDisabled(true);
    startLocationTracking();
    
    // Re-enable button after delay
    setTimeout(() => {
      setTrackingButtonDisabled(false);
    }, 3000);
  }, [startLocationTracking]);

  const handleStopTracking = useCallback(() => {
    setTrackingButtonDisabled(true);
    stopLocationTracking();
    
    // Re-enable button after delay
    setTimeout(() => {
      setTrackingButtonDisabled(false);
    }, 3000);
  }, [stopLocationTracking]);

  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Start location tracking only once when dashboard loads
        if (!isTracking) {
          startLocationTracking();
        }

        // Fetch patient info if user is guardian or doctor
        if (user && (user.role === 'guardian' || user.role === 'doctor')) {
          try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:5000/api/patient/patient-info', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok && mounted) {
              const data = await response.json();
              setPatientInfo(data);
            }
          } catch (error) {
            console.error('Error fetching patient info:', error);
          }
        }

        // Fetch linked guardians if user is patient
        if (user && user.role === 'patient') {
          try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:5000/api/patient/linked-guardians', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok && mounted) {
              const data = await response.json();
              setGuardians(data);
            }
          } catch (error) {
            console.error('Error fetching guardians:', error);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeData();

    // Cleanup
    return () => {
      mounted = false;
      stopLocationTracking();
    };
  }, [user, isTracking, startLocationTracking, stopLocationTracking]);

  const handleLogout = () => {
    stopLocationTracking();
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <p>User not authenticated. Please log in again.</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>DriftGuard Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name} ({user.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="user-details">
            <h2>Your Profile</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            
            {user.role === 'patient' && user.patientKey && (
              <div className="patient-key-section">
                <p><strong>Your Patient Key:</strong> {user.patientKey}</p>
                <p className="help-text">Share this key with your guardians or doctors</p>
              </div>
            )}
          </div>

          {patientInfo && (
            <div className="patient-info">
              <h2>Patient Information</h2>
              <p><strong>Name:</strong> {patientInfo.name}</p>
              <p><strong>Email:</strong> {patientInfo.email}</p>
            </div>
          )}

          {guardians.length > 0 && (
            <div className="guardians-list">
              <h2>Your Guardians</h2>
              <ul>
                {guardians.map(guardian => (
                  <li key={guardian._id}>
                    <strong>{guardian.name}</strong> ({guardian.role})
                    <p>{guardian.email}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="tracking-controls">
            <h2>Location Tracking</h2>
            <div className="tracking-status">
              Status: <span className={isTracking ? 'active' : 'inactive'}>
                {isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {trackingError && (
              <div className="tracking-error">
                Error: {trackingError}
              </div>
            )}
            
            <div className="tracking-buttons">
              <button 
                onClick={handleStartTracking} 
                disabled={isTracking || trackingButtonDisabled}
                className={isTracking || trackingButtonDisabled ? 'disabled' : ''}
              >
                Start Tracking
              </button>
              <button 
                onClick={handleStopTracking} 
                disabled={!isTracking || trackingButtonDisabled}
                className={!isTracking || trackingButtonDisabled ? 'disabled' : ''}
              >
                Stop Tracking
              </button>
            </div>
          </div>
        </div>

        <div className="map-container">
          <LocationMap />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




