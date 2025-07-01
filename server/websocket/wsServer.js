const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const User = require('../models/User');

// Store active connections
const connections = new Map(); // userId -> { ws, user }

const setupWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ noServer: true });
  
  // Handle upgrade
  server.on('upgrade', async (request, socket, head) => {
    try {
      // Parse URL and get token
      const { pathname, query } = url.parse(request.url, true);
      
      if (pathname === '/ws') {
        // Verify JWT token
        const token = query.token;
        if (!token) {
          console.log('WebSocket connection rejected: No token provided');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        try {
          // Verify and decode token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Get user from database
          const user = await User.findById(decoded.id);
          if (!user) {
            console.log('WebSocket connection rejected: User not found');
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }
          
          // Attach user to request for later use
          request.user = user;
          
          // Accept the WebSocket connection
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
          });
        } catch (err) {
          console.error('WebSocket authentication error:', err);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
        }
      } else {
        console.log(`WebSocket connection rejected: Invalid path ${pathname}`);
        socket.destroy();
      }
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }
  });
  
  // Handle connection
  wss.on('connection', (ws, request) => {
    const user = request.user;
    console.log(`WebSocket connected: ${user.name} (${user.role})`);
    
    // Store connection
    connections.set(user._id.toString(), { ws, user });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId: user._id.toString(),
      role: user.role
    }));
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message from ${user.name}:`, data);
        
        // Handle ping messages
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        
        // Handle location updates
        if (data.type === 'locationUpdate' && data.coordinates) {
          const locationData = {
            type: 'locationUpdate',
            userId: user._id.toString(),
            userName: user.name,
            role: user.role,
            coordinates: data.coordinates,
            timestamp: new Date().toISOString()
          };
          
          console.log(`Location update from ${user.name}:`, locationData.coordinates);
          
          // If user is a patient, send to all linked guardians
          if (user.role === 'patient') {
            // Find all guardians linked to this patient
            connections.forEach((conn, userId) => {
              if (conn.user.role === 'guardian' && 
                  conn.user.linkedPatientId && 
                  conn.user.linkedPatientId.toString() === user._id.toString()) {
                if (conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(JSON.stringify(locationData));
                }
              }
            });
          }
          
          // If user is a guardian, send to linked patient
          if (user.role === 'guardian' && user.linkedPatientId) {
            const patientConn = connections.get(user.linkedPatientId.toString());
            if (patientConn && patientConn.ws.readyState === WebSocket.OPEN) {
              patientConn.ws.send(JSON.stringify(locationData));
            }
          }
          
          // Send confirmation back to sender
          ws.send(JSON.stringify({
            type: 'locationConfirmation',
            message: 'Location update received'
          }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket disconnected: ${user.name} (${user.role})`);
      connections.delete(user._id.toString());
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${user.name}:`, error);
    });
    
    // Set up ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });
  
  return wss;
};

module.exports = setupWebSocketServer;
