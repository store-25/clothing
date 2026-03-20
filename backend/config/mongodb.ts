import mongoose from 'mongoose';

// MongoDB Configuration - Original
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/store25';

export async function connectMongoDB(): Promise<void> {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 URI:', MONGO_URI ? 'Set' : 'Not set');
    
    // Connect with timeout and proper options
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', conn.connection.name);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('🔍 Error code:', err.code);
    
    // Exit process if MongoDB fails - it's critical for the application
    console.log('💥 Critical: MongoDB is required for this application to function');
    process.exit(1);
  }
}

// Export connection status checker
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Export graceful disconnect
export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB disconnected gracefully');
  } catch (err: any) {
    console.error('❌ Error disconnecting MongoDB:', err.message);
  }
}
