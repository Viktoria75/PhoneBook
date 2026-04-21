/**
 * Seed script — populates the database with a demo user and 12 sample contacts.
 *
 * Usage:
 *   node seed.js
 *
 * This connects to MongoDB Atlas using the .env connection string,
 * clears existing data, and inserts fresh sample data.
 */

const mongoose = require('mongoose');
const dns = require('dns');
// Force Google DNS to bypass Node.js local network bugs on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const User = require('./models/User');
const Contact = require('./models/Contact');

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Clear existing data
    await User.deleteMany({});
    await Contact.deleteMany({});
    console.log('🗑️  Cleared existing collections');

    // Create demo user
    const demoUser = new User({
      username: 'Demo User',
      email: 'demo@phonebook.com',
      phone: '+359 888 000 000',
      passwordHash: 'password123', // will be hashed by pre-save hook
    });
    await demoUser.save();
    console.log(`👤 Created demo user: demo@phonebook.com / password123`);

    // Sample contacts (from mongodb.md)
    const contacts = [
      {
        firstName: 'Alice',
        lastName: 'Pemberton',
        phones: [
          { label: 'mobile', number: '+1 (555) 201-4892' },
          { label: 'work', number: '+1 (555) 201-0001' },
        ],
        email: 'alice.pemberton@example.com',
        address: { city: 'New York', country: 'USA' },
        notes: 'Met at the 2023 conference',
        isFavorite: true,
      },
      {
        firstName: 'Ben',
        lastName: 'Hargrove',
        phones: [{ label: 'mobile', number: '+1 (555) 334-7761' }],
        email: 'ben.hargrove@example.com',
        address: { city: 'Los Angeles', country: 'USA' },
        isFavorite: false,
      },
      {
        firstName: 'Clara',
        lastName: 'Voss',
        phones: [
          { label: 'mobile', number: '+1 (555) 498-3210' },
          { label: 'home', number: '+1 (555) 498-0000' },
        ],
        email: 'clara.voss@example.com',
        address: { city: 'Berlin', country: 'Germany' },
        isFavorite: false,
      },
      {
        firstName: 'Daniel',
        lastName: 'Mercer',
        phones: [{ label: 'mobile', number: '+1 (555) 112-6530' }],
        isFavorite: false,
      },
      {
        firstName: 'Elena',
        lastName: 'Russo',
        phones: [{ label: 'mobile', number: '+1 (555) 778-9043' }],
        email: 'elena.russo@example.com',
        address: { city: 'Rome', country: 'Italy' },
        isFavorite: true,
      },
      {
        firstName: "Finn",
        lastName: "O'Sullivan",
        phones: [{ label: 'mobile', number: '+1 (555) 663-2187' }],
        address: { city: 'Dublin', country: 'Ireland' },
        isFavorite: false,
      },
      {
        firstName: 'Grace',
        lastName: 'Nakamura',
        phones: [
          { label: 'mobile', number: '+1 (555) 549-8820' },
          { label: 'work', number: '+1 (555) 549-9999' },
        ],
        email: 'grace.nakamura@example.com',
        isFavorite: false,
      },
      {
        firstName: 'Hugo',
        lastName: 'Castillo',
        phones: [{ label: 'mobile', number: '+1 (555) 430-1174' }],
        address: { city: 'Madrid', country: 'Spain' },
        isFavorite: false,
      },
      {
        firstName: 'Isla',
        lastName: 'Thornton',
        phones: [{ label: 'mobile', number: '+1 (555) 227-5563' }],
        isFavorite: false,
      },
      {
        firstName: 'James',
        lastName: 'Bellamy',
        phones: [{ label: 'mobile', number: '+1 (555) 881-3397' }],
        email: 'james.bellamy@example.com',
        isFavorite: false,
      },
      {
        firstName: 'Kira',
        lastName: 'Fontaine',
        phones: [{ label: 'mobile', number: '+1 (555) 362-7748' }],
        address: { city: 'Paris', country: 'France' },
        isFavorite: true,
      },
      {
        firstName: 'Luca',
        lastName: 'Ferretti',
        phones: [{ label: 'mobile', number: '+1 (555) 514-0029' }],
        email: 'luca.ferretti@example.com',
        address: { city: 'Milan', country: 'Italy' },
        isFavorite: false,
      },
    ];

    // Assign all contacts to the demo user
    const contactDocs = contacts.map((c) => ({
      ...c,
      owner: demoUser._id,
    }));

    await Contact.insertMany(contactDocs);
    console.log(`🌱 Inserted ${contacts.length} sample contacts`);

    console.log('');
    console.log('✅ Seed complete! You can now:');
    console.log('   npm run dev       → start the server');
    console.log('   Login with:  demo@phonebook.com / password123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
