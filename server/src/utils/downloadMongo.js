import { MongoMemoryServer } from 'mongodb-memory-server';

console.log('Downloading and starting MongoMemoryServer to cache binary...');
const server = await MongoMemoryServer.create();
console.log('MongoMemoryServer started at:', server.getUri());
await server.stop();
console.log('MongoMemoryServer binary successfully cached!');
process.exit(0);

