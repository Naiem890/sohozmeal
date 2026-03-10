import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

async function dbConnect(): Promise<void> {
  const { DB_URI_CLOUD, DB_URI_LOCAL, NODE_ENV } = process.env;
  let dbUrl: string | null = null;

  if (NODE_ENV === 'development') {
    dbUrl = DB_URI_CLOUD || null;
  } else if (NODE_ENV === 'production') {
    dbUrl = DB_URI_LOCAL || null;
  }

  try {
    await mongoose.connect(dbUrl as string, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    } as any);
    console.log(`Database connected in ${NODE_ENV} mode!`);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

export default dbConnect;
