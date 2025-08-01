import dataSource from './data-source';

async function testConnection() {
  try {
    await dataSource.initialize();
    if (dataSource.isInitialized) {
      console.log('Database connection is working!');
    } else {
      console.log('Database connection failed to initialize.');
    }
    await dataSource.destroy();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection();
