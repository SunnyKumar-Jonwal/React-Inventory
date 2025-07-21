const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

class Database {
  constructor() {
    this.mongod = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Check if running in production or if MongoDB URI is provided
      if (process.env.NODE_ENV === 'production' || process.env.MONGODB_URI?.includes('mongodb+srv')) {
        // Use provided MongoDB URI (Atlas or external MongoDB)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB (External)');
      } else {
        // Use in-memory MongoDB for development
        console.log('🚀 Starting MongoDB Memory Server...');
        this.mongod = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'inventory-management'
          }
        });
        
        const uri = this.mongod.getUri();
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB Memory Server');
        console.log('📍 Database URI:', uri);
      }
      
      this.isConnected = true;
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📴 MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      if (this.mongod) {
        await this.mongod.stop();
      }
      this.isConnected = false;
      console.log('📴 Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = new Database();
