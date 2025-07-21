const mongoose = require('mongoose');

class Database {
  constructor() {
    this.mongod = null;
    this.isConnected = false;
  }

  async connect() {
    console.log('🔌 Starting database connection...');
    
    try {
      // Production: Use MongoDB Atlas
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Connecting to MongoDB Atlas (Production)...');
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI environment variable is required in production');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas (Production)');
        this.isConnected = true;
        return;
      }

      // Development: Try MongoDB Atlas first, then memory server
      if (process.env.MONGODB_URI?.includes('mongodb+srv')) {
        console.log('🚀 Connecting to MongoDB Atlas (Development)...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas (Development)');
        this.isConnected = true;
        return;
      }

      // Development fallback: Try to use memory server
      try {
        console.log('🚀 Starting MongoDB Memory Server (Development)...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        this.mongod = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'inventory-management'
          }
        });
        
        const uri = this.mongod.getUri();
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB Memory Server (Development)');
        console.log('📍 Database URI:', uri);
        this.isConnected = true;
      } catch (error) {
        console.error('❌ MongoDB Memory Server not available, trying local MongoDB...');
        // Final fallback: local MongoDB
        const fallbackUri = 'mongodb://localhost:27017/inventory-management';
        await mongoose.connect(fallbackUri);
        console.log('✅ Connected to Local MongoDB (Fallback)');
        this.isConnected = true;
      }
      
      // Setup connection event handlers
      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.isConnected = true;
    });
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      if (this.mongod) {
        await this.mongod.stop();
        console.log('🛑 MongoDB Memory Server stopped');
      }
      this.isConnected = false;
      console.log('📴 Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
}

// Export a single instance
const databaseInstance = new Database();
module.exports = databaseInstance;
