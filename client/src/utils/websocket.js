class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {
      message: [],
      open: [],
      close: [],
      error: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.messageQueue = [];
    this.pingInterval = null;
  }

  connect(token) {
    if (!token) {
      console.error('Cannot connect WebSocket: No token provided');
      return;
    }
    
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }
    
    // Check if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      this.processMessageQueue();
      return;
    }
    
    // Clean up any existing socket
    this.cleanup();

    this.isConnecting = true;
    console.log('Connecting to WebSocket...');
    
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:5000/ws?token=${token}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.notifyListeners('open');
        this.processMessageQueue();
        
        // Set up ping to keep connection alive
        this.setupPing();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.notifyListeners('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.notifyListeners('close', event);
        
        // Clear ping interval
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect(token);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.notifyListeners('error', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect(token);
    }
  }

  setupPing() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Send a ping message every 25 seconds to keep the connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send a simple ping message
        this.sendMessage({ type: 'ping' });
      } else {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    }, 25000);
  }

  cleanup() {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Clean up socket
    if (this.socket) {
      // Store reference to avoid issues during cleanup
      const socket = this.socket;
      this.socket = null;
      
      // Remove event handlers
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.onopen = null;
      
      // Close if needed
      if (socket.readyState === WebSocket.OPEN || 
          socket.readyState === WebSocket.CONNECTING) {
        try {
          socket.close();
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      }
    }
  }

  attemptReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    this.cleanup();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
  }

  processMessageQueue() {
    if (this.messageQueue.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log(`Processing message queue (${this.messageQueue.length} messages)...`);
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        try {
          this.socket.send(JSON.stringify(message));
        } catch (e) {
          console.error('Error sending queued message:', e);
          // Put the message back in the queue
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  sendMessage(data) {
    if (!data) return;
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (e) {
        console.error('Error sending WebSocket message:', e);
        this.messageQueue.push(data);
      }
    } else {
      console.log('WebSocket not connected, adding message to queue');
      this.messageQueue.push(data);
      
      // Try to reconnect if not already connecting
      if (!this.isConnecting) {
        const token = localStorage.getItem('userToken');
        if (token) {
          this.connect(token);
        }
      }
    }
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

const webSocketService = new WebSocketService();
export default webSocketService;

