import webSocketService from './websocket';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.listeners = {
      update: [],
      error: []
    };
    this.options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    };
    this.lastPosition = null;
    this.minUpdateInterval = 2000; // Minimum time between updates in ms
    this.lastUpdateTime = 0;
    this.errorCount = 0;
    this.maxErrorCount = 3;
    

  }

  updateCoordinates(coordinates) {
  this.latestCoordinates = coordinates;
}


  handlePositionUpdate(position) {
  console.log("Position update received:", position);
  const now = Date.now();

  if (now - this.lastUpdateTime < this.minUpdateInterval) {
    console.log("Update throttled (too frequent)");
    return;
  }

  this.lastPosition = position;
  this.lastUpdateTime = now;

  const coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  };

  console.log("Sending coordinates to listeners:", coordinates);

  // ✅ Update WebSocketService
  webSocketService.updateCoordinates(coordinates);

  this.notifyListeners('update', coordinates);

  // ✅ Already pushed here if location was new:
  webSocketService.sendMessage({
    type: 'locationUpdate',
    coordinates
  });
}


  startTracking() {
    if (!navigator.geolocation) {
      this.notifyListeners('error', new Error('Geolocation is not supported by your browser'));
      return false;
    }
    
    if (this.isTracking) {
      return true;
    }
    
    try {
      // Reset error count
      this.errorCount = 0;
      
      // First try to get current position immediately
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Initial position obtained:", position);
          this.handlePositionUpdate(position);
          
          // Then start watching for position updates
          this.watchId = navigator.geolocation.watchPosition(
            this.handlePositionUpdate.bind(this),
            this.handlePositionError.bind(this),
            this.options
          );
        },
        (error) => {
          console.error("Error getting initial position:", error);
          this.handlePositionError(error);
          
          // Still try to watch position even if initial position fails
          this.watchId = navigator.geolocation.watchPosition(
            this.handlePositionUpdate.bind(this),
            this.handlePositionError.bind(this),
            this.options
          );
        },
        this.options
      );
      
      this.isTracking = true;
      return true;
    } catch (error) {
      console.error("Error in startTracking:", error);
      this.notifyListeners('error', error);
      return false;
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
    }
  }

  handlePositionUpdate(position) {
    console.log("Position update received:", position);
    const now = Date.now();
    
    // Throttle updates to prevent too frequent position changes
    if (now - this.lastUpdateTime < this.minUpdateInterval) {
      console.log("Update throttled (too frequent)");
      return;
    }
    
    // Check if position has changed significantly
    if (this.lastPosition) {
      const prevLat = this.lastPosition.coords.latitude;
      const prevLng = this.lastPosition.coords.longitude;
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;
      
      // Calculate distance (very rough approximation)
      const distance = Math.sqrt(
        Math.pow(newLat - prevLat, 2) + 
        Math.pow(newLng - prevLng, 2)
      );
      
      // If position hasn't changed much, don't update
      if (distance < 0.00001) { // Very small threshold
        console.log("Update throttled (position hasn't changed)");
        return;
      }
    }
    
    this.lastPosition = position;
    this.lastUpdateTime = now;
    
    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
    
    console.log("Sending coordinates to listeners:", coordinates);
    
    // Reset error count on successful update
    this.errorCount = 0;
    
    // Notify local listeners
    this.notifyListeners('update', coordinates);
    
    // Send to server via WebSocket
    webSocketService.sendMessage({
      type: 'locationUpdate',
      coordinates
    });
  }

  handlePositionError(error) {
    console.error("Position error:", error);
    this.errorCount++;
    
    // If we've had too many errors, stop tracking
    if (this.errorCount >= this.maxErrorCount) {
      console.log("Too many errors, stopping tracking");
      this.stopTracking();
    }
    
    let errorMessage;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location services in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your device GPS or try again later.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please check your internet connection.';
        break;
      default:
        errorMessage = 'An unknown error occurred while getting location.';
    }
    
    const errorObj = new Error(errorMessage);
    errorObj.originalError = error;
    
    this.notifyListeners('error', errorObj);
  }

  addListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  
  removeAllListeners() {
    this.listeners = {
      update: [],
      error: []
    };
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

const locationService = new LocationService();
export default locationService;

