import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Case } from '../models/Case.js';
import { OpdVisit } from '../models/OpdVisit.js';
import { LabOrder } from '../models/LabOrder.js';
import { Inventory } from '../models/Inventory.js';
import {
  DEFAULT_USERS,
  DEFAULT_HOSPITALS,
  DEFAULT_CASES,
  DEFAULT_OPD_VISITS,
  DEFAULT_LAB_ORDERS,
  DEFAULT_INVENTORY
} from '../data/initialData.js';

dotenv.config();

const seedDatabase = async () => {
  console.log('[Seeder] Connecting to MongoDB...');
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error('[Seeder] Could not connect to MongoDB. Make sure MongoDB service is running.');
    process.exit(1);
  }

  try {
    console.log('[Seeder] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Case.deleteMany({}),
      OpdVisit.deleteMany({}),
      LabOrder.deleteMany({}),
      Inventory.deleteMany({})
    ]);

    console.log('[Seeder] Populating default users...');
    await User.insertMany(DEFAULT_USERS);

    console.log('[Seeder] Populating default hospitals...');
    await Hospital.insertMany(DEFAULT_HOSPITALS);

    console.log('[Seeder] Populating default clinical cases...');
    await Case.insertMany(DEFAULT_CASES);

    console.log('[Seeder] Populating default OPD visits...');
    await OpdVisit.insertMany(DEFAULT_OPD_VISITS);

    console.log('[Seeder] Populating default Lab orders...');
    await LabOrder.insertMany(DEFAULT_LAB_ORDERS);

    console.log('[Seeder] Populating default inventory...');
    await Inventory.insertMany(DEFAULT_INVENTORY);

    console.log('--------------------------------------------------');
    console.log('✅ [Seeder] Database successfully seeded with demo hospital records!');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error during seeding:', err);
    process.exit(1);
  }
};

seedDatabase();
