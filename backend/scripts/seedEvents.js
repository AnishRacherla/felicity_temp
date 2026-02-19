/**
 * SEED EVENTS SCRIPT
 * 
 * This script creates sample events for testing
 * Run: node scripts/seedEvents.js
 */

import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import { generatePassword } from '../src/utils/validators.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Create sample organizer if doesn't exist
const createOrganizer = async () => {
  try {
    // Check if organizer exists
    let organizer = await User.findOne({ email: 'techteam@felicity.iiit.ac.in', role: 'organizer' });
    
    if (!organizer) {
      const password = generatePassword();
      organizer = await User.create({
        firstName: 'Tech',
        lastName: 'Team',
        email: 'techteam@felicity.iiit.ac.in',
        password: password,
        role: 'organizer',
        organizerName: 'TechTeam',
        category: 'TECHNICAL',
        organizerDescription: 'Organizing technical events and workshops',
        contactEmail: 'techteam@felicity.iiit.ac.in',
      });
      console.log(`✅ Created organizer: techteam@felicity.iiit.ac.in / ${password}`);
    } else {
      console.log('✅ Using existing organizer: TechTeam');
    }
    
    return organizer;
  } catch (error) {
    console.error('❌ Error creating organizer:', error.message);
    throw error;
  }
};

// Create sample events
const seedEvents = async (organizer) => {
  try {
    // Clear existing events (optional - comment out if you want to keep existing events)
    // await Event.deleteMany({});
    // console.log('🗑️ Cleared existing events');

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Sample events
    const events = [
      {
        eventName: 'Hackathon 2026',
        description: 'Join us for a 24-hour coding marathon! Build innovative solutions to real-world problems. Teams of up to 4 members. Amazing prizes and swag for winners!',
        eventType: 'NORMAL',
        eventStartDate: nextWeek,
        eventEndDate: new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000), // +24 hours
        venue: 'Vindhya A Block, IIIT Hyderabad',
        organizer: organizer._id,
        registrationDeadline: new Date(nextWeek.getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days
        registrationLimit: 100,
        registrationFee: 0,
        eligibility: 'ALL',
        customForm: [
          { fieldName: 'Team Name', fieldType: 'text', required: true, placeholder: 'Enter your team name' },
          { fieldName: 'Team Leader Contact', fieldType: 'text', required: true, placeholder: '+91 1234567890' },
          { fieldName: 'Team Size', fieldType: 'dropdown', required: true, options: ['1', '2', '3', '4'] },
          { fieldName: 'Problem Statement Preference', fieldType: 'dropdown', required: false, options: ['AI/ML', 'Web Development', 'Mobile Apps', 'IoT', 'No preference'] },
        ],
        tags: ['coding', 'hackathon', 'competition', 'tech'],
        status: 'PUBLISHED',
      },
      {
        eventName: 'Web Development Workshop',
        description: 'Learn modern web development with React, Node.js, and MongoDB. Hands-on workshop covering frontend and backend development. All skill levels welcome!',
        eventType: 'NORMAL',
        eventStartDate: tomorrow,
        eventEndDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000), // +4 hours
        venue: 'KRB Seminar Hall, IIIT Hyderabad',
        organizer: organizer._id,
        registrationDeadline: now,
        registrationLimit: 50,
        registrationFee: 200,
        eligibility: 'ALL',
        customForm: [
          { fieldName: 'Laptop Available', fieldType: 'dropdown', required: true, options: ['Yes', 'No'] },
          { fieldName: 'Prior Experience', fieldType: 'dropdown', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
        ],
        tags: ['workshop', 'web-development', 'react', 'node', 'learning'],
        status: 'PUBLISHED',
      },
      {
        eventName: 'Felicity T-Shirt 2026',
        description: 'Official Felicity 2026 T-shirts! Premium quality cotton with unique designs. Limited edition - grab yours now!',
        eventType: 'MERCHANDISE',
        eventStartDate: now,
        eventEndDate: nextMonth,
        venue: 'Online (Delivery at campus)',
        organizer: organizer._id,
        registrationDeadline: new Date(nextMonth.getTime() - 5 * 24 * 60 * 60 * 1000), // -5 days
        registrationLimit: 500,
        registrationFee: 399,
        eligibility: 'ALL',
        merchandise: {
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['Black', 'White', 'Navy Blue', 'Maroon'],
          stock: 500,
        },
        tags: ['merchandise', 't-shirt', 'felicity', 'limited-edition'],
        status: 'PUBLISHED',
      },
      {
        eventName: 'AI/ML Talk Series',
        description: 'Guest lecture series featuring industry experts discussing latest trends in Artificial Intelligence and Machine Learning. Q&A session included.',
        eventType: 'NORMAL',
        eventStartDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000), // nextWeek + 3 days
        eventEndDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
        venue: 'Online (Zoom link will be shared)',
        organizer: organizer._id,
        registrationDeadline: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
        registrationLimit: 200,
        registrationFee: 0,
        eligibility: 'ALL',
        customForm: [
          { fieldName: 'College Name', fieldType: 'text', required: true },
          { fieldName: 'Area of Interest', fieldType: 'dropdown', required: true, options: ['Deep Learning', 'Computer Vision', 'NLP', 'Robotics', 'General'] },
        ],
        tags: ['ai', 'machine-learning', 'talk', 'guest-lecture'],
        status: 'PUBLISHED',
      },
      {
        eventName: 'Gaming Tournament',
        description: 'Esports tournament featuring popular games. Solo and team competitions. Cash prizes for winners! Register your team now.',
        eventType: 'NORMAL',
        eventStartDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000),
        eventEndDate: new Date(nextWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        venue: 'Computer Lab 3, IIIT Hyderabad',
        organizer: organizer._id,
        registrationDeadline: new Date(nextWeek.getTime() + 4 * 24 * 60 * 60 * 1000),
        registrationLimit: 80,
        registrationFee: 100,
        eligibility: 'IIIT_ONLY',
        customForm: [
          { fieldName: 'Game Preference', fieldType: 'dropdown', required: true, options: ['Valorant', 'CS:GO', 'FIFA', 'BGMI'] },
          { fieldName: 'Team/Solo', fieldType: 'dropdown', required: true, options: ['Solo', 'Team'] },
          { fieldName: 'IGN (In-Game Name)', fieldType: 'text', required: true },
        ],
        tags: ['gaming', 'esports', 'tournament', 'competition'],
        status: 'PUBLISHED',
      },
      {
        eventName: 'Cultural Night - Dance Competition',
        description: 'Show off your dance moves! Solo and group performances welcome. Multiple categories: Classical, Contemporary, Hip-Hop, Bollywood. Grand prizes!',
        eventType: 'NORMAL',
        eventStartDate: new Date(nextMonth.getTime() - 5 * 24 * 60 * 60 * 1000),
        eventEndDate: new Date(nextMonth.getTime() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        venue: 'Main Auditorium, IIIT Hyderabad',
        organizer: organizer._id,
        registrationDeadline: new Date(nextMonth.getTime() - 10 * 24 * 60 * 60 * 1000),
        registrationLimit: 150,
        registrationFee: 50,
        eligibility: 'ALL',
        customForm: [
          { fieldName: 'Performance Type', fieldType: 'dropdown', required: true, options: ['Solo', 'Duet', 'Group (3-6)', 'Group (7+)'] },
          { fieldName: 'Dance Style', fieldType: 'dropdown', required: true, options: ['Classical', 'Contemporary', 'Hip-Hop', 'Bollywood', 'Fusion'] },
          { fieldName: 'Song Name (if any specific)', fieldType: 'text', required: false },
        ],
        tags: ['cultural', 'dance', 'competition', 'performance'],
        status: 'PUBLISHED',
      },
    ];

    // Insert events
    const createdEvents = await Event.insertMany(events);
    console.log(`✅ Created ${createdEvents.length} sample events:`);
    createdEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.eventName} (${event.eventType})`);
    });

    return createdEvents;
  } catch (error) {
    console.error('❌ Error seeding events:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🌱 Starting event seeding...\n');
    
    await connectDB();
    const organizer = await createOrganizer();
    await seedEvents(organizer);
    
    console.log('\n✅ Event seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Events are now available in the database');
    console.log('   - Visit Browse Events page to see them');
    console.log('   - Register for events to test the full flow\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the script
main();
