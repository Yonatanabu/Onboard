const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
connectDB();

const User = require('./models/User');
const Buddy = require('./models/Buddy');
const Task = require('./models/Task');
const Onboarding = require('./models/Onboarding');
const Assignment = require('./models/Assignment');

const departments = ['frontend','backend','mobile','design','qa','marketing','sales'];

const seed = async () => {
  try {
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Buddy.deleteMany({}),
      Task.deleteMany({}),
      Onboarding.deleteMany({}),
      Assignment.deleteMany({})
    ]);

    console.log('Creating admin user...');
    // Use a valid department value to satisfy schema enum, role governs permissions
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      department: 'marketing',
      role: 'HR/Admin',
      isAdmin: true,
      approved: true
    });
    console.log('Admin created:', admin.email);

    console.log('Creating buddies and employees with tasks...');

    for (const dept of departments) {
      // Map employee department keys to Buddy.department enum values
      const deptMap = {
        frontend: 'Engineering',
        backend: 'Engineering',
        mobile: 'Engineering',
        design: 'Design',
        qa: 'QA',
        marketing: 'Marketing',
        sales: 'Sales'
      };
      const buddyDepartment = deptMap[dept] || 'Engineering';

      // create a buddy for the department
      const buddy = await Buddy.create({
        name: `${dept.charAt(0).toUpperCase() + dept.slice(1)} Buddy`,
        email: `buddy.${dept}@example.com`,
        department: buddyDepartment,
        available: true
      });

      // create an employee for the department
      const employee = await User.create({
        name: `${dept.charAt(0).toUpperCase() + dept.slice(1)} Employee`,
        email: `${dept}.employee@example.com`,
        password: 'password123',
        department: dept,
        approved: true
      });

      // assign buddy to employee
      employee.buddy = buddy._id;
      await employee.save();

      // add employee to buddy assignedEmployees
      buddy.assignedEmployees = buddy.assignedEmployees || [];
      buddy.assignedEmployees.push(employee._id);
      await buddy.save();

      // create sample tasks for the employee
      const tasks = [
        { title: `Complete ${dept} onboarding checklist`, type: 'task' },
        { title: `Read ${dept} handbook`, type: 'task' },
        { title: `Intro video for ${dept}`, type: 'video', url: `https://example.com/${dept}-intro` }
      ];

      for (const t of tasks) {
        const taskDoc = await Task.create({
          title: t.title,
          type: t.type,
          url: t.url || undefined,
          completed: false,
          employee: employee._id
        });
        employee.tasks = employee.tasks || [];
        employee.tasks.push(taskDoc._id);
      }
      await employee.save();

      // create onboarding for employee
      await Onboarding.create({
        employee: employee._id,
        steps: [
          { key: 'personal', title: 'Personal Info', data: {}, completed: false },
          { key: 'documents', title: 'Document Upload', data: {}, completed: false },
          { key: 'workspace', title: 'Workspace Setup', data: {}, completed: false },
          { key: 'team', title: 'Team Introduction', data: {}, completed: false }
        ],
        currentStep: 'personal',
        progress: 0
      });
    }

    console.log('Seeding complete.');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seed();
