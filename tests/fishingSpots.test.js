const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const FishingSpot = require('../models/FishingSpots');

beforeAll(async () => {
    const mongoURI = 'mongodb://localhost:27017/fishing_test';
    await mongoose.connect(mongoURI);
});

beforeEach(async () => {
    await FishingSpot.deleteMany({});
    await FishingSpot.create([
        { name: "gratis plads", type: "gratis" },
        { name: "betalings plads", type: "betalings" },
        { name: "Privat plads", type: "privat" }
    ]);
});

afterAll(async () => {
    const conn = mongoose.connection;
    if (conn && conn.readyState === 1 && conn.db) {
        await conn.db.dropDatabase();
    }
    await mongoose.disconnect();
});

test("kun gratis steder returneres", async () => {
    const response = await request(app).get('/fishing-spots?type=gratis');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe("gratis plads");
});

test("kun betalings steder returneres", async () => {
    const response = await request(app).get('/fishing-spots?type=betalings');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe("betalings plads");
});

test("kun privat steder returneres", async () => {
    const response = await request(app).get('/fishing-spots?type=privat');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe("Privat plads");
});

test("alle steder returneres uden filter", async () => {
    const response = await request(app).get('/fishing-spots');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
});
