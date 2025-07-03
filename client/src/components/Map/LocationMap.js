import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import './LocationMap.css';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
// Custom icons
const currentUserIcon = L.icon({
  iconUrl: require('./current-location.png'),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const guardianIcon = L.icon({
  iconUrl: require('./guardian.png'),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const patientIcon = L.icon({
  iconUrl: require('./patient.png'),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});


// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const LocationMap = () => {
  const { user } = useAuth();
  const { myLocation, connectedUsers } = useLocation();
  const [allLocations, setAllLocations] = useState([]);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [debugInfo, setDebugInfo] = useState({
    myLocation: null,
    connectedUsers: {}
  });

  // Debug info
  useEffect(() => {
    setDebugInfo({
      myLocation: myLocation,
      connectedUsers: connectedUsers
    });
  }, [myLocation, connectedUsers]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    try {
      // Create map if it doesn't exist
      if (!leafletMapRef.current) {
        console.log("Initializing map...");
        leafletMapRef.current = L.map(mapRef.current).setView([51.505, -0.09], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMapRef.current);
        
        console.log("Map initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map: " + error.message);
    }
    
    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update locations
  useEffect(() => {
    console.log("Location update - My location:", myLocation);
    console.log("Location update - Connected users:", connectedUsers);
    
    const locations = [];
    
    // Add my location if available
    if (myLocation && myLocation.latitude && myLocation.longitude) {
      console.log("Adding my location to map:", myLocation);
      locations.push({
        id: 'me',
        name: 'My Location',
        role: user?.role || 'unknown',
        lat: myLocation.latitude,
        lng: myLocation.longitude,
        isMe: true
      });
    }
    
    // Add connected users' locations
    Object.values(connectedUsers).forEach(connectedUser => {
      if (connectedUser.coordinates && 
          connectedUser.coordinates.latitude && 
          connectedUser.coordinates.longitude) {
        console.log("Adding connected user to map:", connectedUser);
        locations.push({
          id: connectedUser.userId,
          name: connectedUser.userName,
          role: connectedUser.role,
          lat: connectedUser.coordinates.latitude,
          lng: connectedUser.coordinates.longitude,
          isMe: false
        });
      }
    });
    
    console.log("All locations for map:", locations);
    setAllLocations(locations);
  }, [myLocation, connectedUsers, user]);

  // Update markers when locations change
  useEffect(() => {
    if (!leafletMapRef.current) {
      console.log("Map not initialized yet, can't add markers");
      return;
    }
    
    if (allLocations.length === 0) {
      console.log("No locations to display on map");
      return;
    }
    
    console.log("Updating map markers with locations:", allLocations);
    
    try {
      // Clear existing markers
      Object.values(markersRef.current).forEach(marker => {
        leafletMapRef.current.removeLayer(marker);
      });
      markersRef.current = {};
      
      // Add new markers
      allLocations.forEach(location => {
        console.log("Adding marker for:", location);
        const marker = L.marker([location.lat, location.lng])
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <strong>${location.name}</strong><br>
            Role: ${location.role}<br>
            ${!location.isMe ? `Last updated: ${new Date().toLocaleTimeString()}` : ''}
          `);
        
        markersRef.current[location.id] = marker;
      });
      
      // Fit map to show all markers
      if (allLocations.length === 1) {
        leafletMapRef.current.setView([allLocations[0].lat, allLocations[0].lng], 15);
      } else {
        const bounds = L.latLngBounds(allLocations.map(loc => [loc.lat, loc.lng]));
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error updating map markers:", error);
      setMapError("Failed to update map markers: " + error.message);
    }
  }, [allLocations]);

  // If there's an error, show it
  if (mapError) {
    return (
      <div className="location-map-container error">
        <p>Error: {mapError}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  // If no locations, show loading
  if (!myLocation && Object.keys(connectedUsers).length === 0) {
    return (
      <div className="location-map-container loading">
        <p>Waiting for location data...</p>
        <div className="debug-info">
          <p><strong>Debug Info:</strong></p>
          <p>My Location: {JSON.stringify(debugInfo.myLocation)}</p>
          <p>Connected Users: {Object.keys(debugInfo.connectedUsers).length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-map-container">
      <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
      {allLocations.length === 0 && (
        <div className="map-overlay">
          <p>No locations to display on map</p>
        </div>
      )}
    </div>
  );
};

export default LocationMap;



