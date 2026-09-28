import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Usage: node seed/makeAdmin.js MCA2024017
const collegeId = process.argv[2];

if (!collegeId) {
  console.error('Usage: node seed/makeAdmin.js <collegeId>');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.updateOne({ _id: collegeId }, { $addToSet: { roles: 'admin' } });

  if (result.matchedCount === 0) {
    console.error(`No user found with collegeId "${collegeId}"`);
  } else {
    console.log(`"${collegeId}" now has the admin role.`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});