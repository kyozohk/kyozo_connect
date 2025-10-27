import { MongoClient } from 'mongodb'

const MONGO_URI = "mongodb+srv://1234dev28:4testconnect@prod-kyozo-db.8rs1g.mongodb.net/?retryWrites=true&w=majority&appName=prod-kyozo-db";
const DB_NAME = "Prod-Kyozo";

const options = {
    maxPoolSize: 50,
    wtimeoutMS: 2500,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof global & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(MONGO_URI, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    client = new MongoClient(MONGO_URI, options);
    clientPromise = client.connect();
}

export async function getDb() {
    const client = await clientPromise;
    return client.db(DB_NAME);
}
