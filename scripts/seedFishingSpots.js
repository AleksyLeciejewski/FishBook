import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FishingSpot from '../models/fishingSpots.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Sample fishing spots data
const sampleSpots = [
    {
        name: 'Møllesøen',
        type: 'privat',
        description: 'A peaceful lake known for its abundance of trout and bass. Great for both beginners and experienced anglers.',
        location: {
            lat: 54.845948,
            lng: 11.979249,
            name: 'Virket, Danmark'
        }
    },
    {
        name: 'River Bend Fishery',
        type: 'betalings',
        description: 'Well-maintained fishery with carp, pike, and catfish. Facilities include fishing platforms and a tackle shop.',
        location: {
            lat: 52.234567,
            lng: 21.234567,
            name: 'Białystok, Poland'
        },
        price: 50 // PLN per day
    },
    {
        name: 'Mountain Stream',
        type: 'gratis',
        description: 'Crystal clear mountain stream with native brown trout. Fly fishing recommended.',
        location: {
            lat: 49.123456,
            lng: 20.123456,
            name: 'Zakopane, Poland'
        }
    },
    {
        name: 'Private Carp Pond',
        type: 'privat',
        description: 'Exclusive private pond stocked with large carp. Catch and release only.',
        location: {
            lat: 52.345678,
            lng: 21.345678,
            name: 'Warsaw, Poland'
        },
        contact: 'jan.kowalski@example.com',
        rules: 'Catch and release only. Barbless hooks required.'
    },
    {
        name: 'Coastal Pier',
        type: 'gratis',
        description: 'Popular sea fishing spot with mackerel, cod, and sea bass. Best during high tide.',
        location: {
            lat: 54.123456,
            lng: 18.123456,
            name: 'Gdynia, Poland'
        }
    }
];

// Connect to MongoDB
const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fishbook';
    console.log('Connecting to MongoDB at:', mongoURI);

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
        return true;
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        return false;
    }
};

// Seed the database
const seedDB = async () => {
    const isConnected = await connectDB();
    if (!isConnected) {
        console.error('Failed to connect to MongoDB. Exiting...');
        process.exit(1);
    }

    try {
        // Clear existing data
        await FishingSpot.deleteMany({});
        console.log('Cleared existing fishing spots');

        // Insert sample data
        const createdSpots = await FishingSpot.insertMany(sampleSpots);
        console.log(`Successfully seeded ${createdSpots.length} fishing spots`);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seeder
seedDB();