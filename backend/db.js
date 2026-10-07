import mongoose from 'mongoose';

export const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      `[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
    throw error;
  }
};