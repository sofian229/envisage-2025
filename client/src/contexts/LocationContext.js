import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import webSocketService from '../utils/websocket';
import locationService from '../utils/locationService';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [myLocation, setMyLocation] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Add refs to track state changes and prevent rapid toggling
  const trackingTimeoutRef = useRef(null);
  const isTrackingRef = useRef(false);
  const trackingAttemptsRef = useRef(0);
  const MAX_TRACKING_ATTEMPTS = 3;

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('userToken');
    if (!token) return;

    // Connect to WebSocket
    webSocketService.connect(token);

    // Add WebSocket message listener
    const handleMessage = (data) => {
      if (data.type === 'locationUpdate' && data.userId !== user.id) {
        setConnectedUsers(prev => ({
          ...prev,
          [data.userId]: {
            userId: data.userId,
            userName: data.userName,
            role: data.role,
            coordinates: data.coordinates,
            timestamp: data.timestamp
          }
        }));
      } else if (data.type === 'connected') {
        setWsConnected(true);
      }
    };

    const handleOpen = () => {
      setWsConnected(true);
    };

    const handleClose = () => {
      setWsConnected(false);
    };

    const handleError = () => {
      setWsConnected(false);
    };

    webSocketService.addListener('message', handleMessage);
    webSocketService.addListener('open', handleOpen);
    webSocketService.addListener('close', handleClose);
    webSocketService.addListener('error', handleError);

    // Cleanup
    return () => {
      webSocketService.removeListener('message', handleMessage);
      webSocketService.removeListener('open', handleOpen);
      webSocketService.removeListener('close', handleClose);
      webSocketService.removeListener('error', handleError);
      webSocketService.disconnect();
      
      // Clear any pending timeouts
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
        trackingTimeoutRef.current = null;
      }
    };
  }, [user]);

  // Start location tracking with debounce and error handling
  const startLocationTracking = () => {
    // Prevent starting if already tracking or if we've had too many attempts
    if (isTrackingRef.current) {
      return true;
    }
    
    if (trackingAttemptsRef.current >= MAX_TRACKING_ATTEMPTS) {
      setTrackingError('Too many tracking attempts. Please refresh the page and try again.');
      return false;
    }
    
    // Increment tracking attempts
    trackingAttemptsRef.current += 1;
    
    if (!user) {
      setTrackingError('User must be logged in to track location');
      return false;
    }

    setTrackingError(null);
    
    // Set tracking state to prevent multiple calls
    isTrackingRef.current = true;
    setIsTracking(true);

    // Add location update listener
    const handleLocationUpdate = (coordinates) => {
      setMyLocation(coordinates);
      
      // Reset tracking attempts on successful update
      trackingAttemptsRef.current = 0;
    };

    const handleLocationError = (error) => {
      console.error('Location tracking error:', error);
      setTrackingError(error.message || 'Unknown location tracking error');
      
      // Use timeout to prevent rapid toggling
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
      
      trackingTimeoutRef.current = setTimeout(() => {
        setIsTracking(false);
        isTrackingRef.current = false;
        trackingTimeoutRef.current = null;
      }, 2000); // 2 second delay before allowing state change
    };

    locationService.addListener('update', handleLocationUpdate);
    locationService.addListener('error', handleLocationError);

    // Start tracking with a delay to prevent rapid toggling
    try {
      const success = locationService.startTracking();
      
      if (!success) {
        // If tracking fails, set state after a delay
        trackingTimeoutRef.current = setTimeout(() => {
          setIsTracking(false);
          isTrackingRef.current = false;
          trackingTimeoutRef.current = null;
        }, 2000);
      }
      
      return success;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      
      // Set state after a delay
      trackingTimeoutRef.current = setTimeout(() => {
        setIsTracking(false);
        isTrackingRef.current = false;
        trackingTimeoutRef.current = null;
      }, 2000);
      
      return false;
    }
  };

  // Stop location tracking with debounce
  const stopLocationTracking = () => {
    // Prevent stopping if not tracking
    if (!isTrackingRef.current) {
      return;
    }
    
    // Remove listeners first to prevent callbacks
    locationService.removeAllListeners();
    locationService.stopTracking();
    
    // Set state with a slight delay to prevent rapid toggling
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }
    
    trackingTimeoutRef.current = setTimeout(() => {
      setIsTracking(false);
      isTrackingRef.current = false;
      trackingTimeoutRef.current = null;
    }, 500); // Half-second delay
  };

  return (
    <LocationContext.Provider
      value={{
        myLocation,
        connectedUsers,
        isTracking,
        trackingError,
        wsConnected,
        startLocationTracking,
        stopLocationTracking
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};


