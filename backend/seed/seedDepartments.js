import 'dotenv/config';
import mongoose from 'mongoose';
import Department from '../models/Department.js';

// EDIT THIS LIST to match your college's real departments and programs.
const departments = [
  { deptName: 'Computer Applications', programName: 'MCA' },
  { deptName: 'Business Administration', programName: 'MBA' },
  { deptName: 'Computer Science and Engineering', programName: 'B.Tech' },
  { deptName: 'Computer Science and Engineering', programName: 'M.Tech' },
  { deptName: 'Electronics and Communication Engineering', programName: 'B.Tech' },
  { deptName: 'Mechanical Engineering', programName: 'B.Tech' },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  for (const dept of departments) {
    // Skips anything already present, so re-running never duplicates rows.
    const exists = await Department.findOne(dept).collation({ locale: 'en', strength: 2 });
    if (!exists) {
      await Department.create(dept);
      created++;
      console.log(`+ ${dept.deptName} (${dept.programName})`);
    }
  }

  console.log(`Done. ${created} created, ${departments.length - created} already existed.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});