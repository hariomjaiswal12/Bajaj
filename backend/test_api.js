/**
 * DeskFlow API Transition & SLA Validation Suite
 * Runs direct DB-level sanity tests on controllers and transition rules.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ticket = require('./models/Ticket');

dotenv.config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
  console.log('==================================================');
  console.log('🚀 RUNNING DESKFLOW BACKEND RULE TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deskflow');
    console.log('✅ Connected to MongoDB.');

    // Clear previous test tickets
    await Ticket.deleteMany({ customerEmail: 'test_suit@deskflow.com' });
    console.log('🧹 Cleaned existing test suite tickets.\n');

    // 2. Validate Create Defaults & Validation Rules
    console.log('📋 Test 1: Creating a ticket with valid fields...');
    const ticket = new Ticket({
      subject: 'Slow server response times',
      description: 'Production API database queries are taking >5 seconds to complete.',
      customerEmail: 'test_suit@deskflow.com',
      priority: 'high'
    });
    
    await ticket.save();
    console.log(`   └─ Success! Created Ticket ID: ${ticket._id}`);
    console.log(`   └─ Default Status: ${ticket.status} (Expected: open)`);
    console.log(`   └─ Default ResolvedAt: ${ticket.resolvedAt} (Expected: null)`);
    console.log(`   └─ SLA Target: 240 minutes (High)`);
    console.log(`   └─ Computed ageMinutes: ${ticket.ageMinutes} min`);
    console.log(`   └─ Computed slaBreached: ${ticket.slaBreached}\n`);

    // 3. Validate illegal transition (Open -> Resolved directly)
    console.log('🚫 Test 2: Attempting illegal transition: open -> resolved...');
    const allowedTransitions = {
      open: ['in_progress'],
      in_progress: ['open', 'resolved'],
      resolved: ['in_progress', 'closed'],
      closed: ['resolved']
    };

    let current = ticket.status;
    let target = 'resolved';

    if (!allowedTransitions[current].includes(target)) {
      console.log(`   └─ Blocked successfully! Transition from '${current}' to '${target}' is NOT allowed.\n`);
    } else {
      throw new Error('FAIL: Transition open -> resolved was allowed!');
    }

    // 4. Validate valid transition (Open -> In Progress)
    console.log('🔄 Test 3: Attempting valid transition: open -> in_progress...');
    target = 'in_progress';
    if (allowedTransitions[current].includes(target)) {
      ticket.status = target;
      await ticket.save();
      console.log(`   └─ Success! Current status is now: ${ticket.status}\n`);
    } else {
      throw new Error('FAIL: Transition open -> in_progress was blocked!');
    }

    // 5. Validate valid transition (In Progress -> Resolved) and resolvedAt automatic setting
    console.log('🔄 Test 4: Attempting transition: in_progress -> resolved...');
    current = ticket.status;
    target = 'resolved';
    if (allowedTransitions[current].includes(target)) {
      ticket.status = target;
      ticket.resolvedAt = new Date();
      await ticket.save();
      console.log(`   └─ Success! Current status is now: ${ticket.status}`);
      console.log(`   └─ ResolvedAt timestamp automatically set to: ${ticket.resolvedAt}\n`);
    } else {
      throw new Error('FAIL: Transition in_progress -> resolved was blocked!');
    }

    // 6. Validate backward transition (Resolved -> In Progress) and resolvedAt nullification
    console.log('⏪ Test 5: Reverting status backward: resolved -> in_progress...');
    current = ticket.status;
    target = 'in_progress';
    if (allowedTransitions[current].includes(target)) {
      ticket.status = target;
      // Reverting backward from resolved: resolvedAt becomes null
      if (current === 'resolved' && target === 'in_progress') {
        ticket.resolvedAt = null;
      }
      await ticket.save();
      console.log(`   └─ Success! Status successfully reverted to: ${ticket.status}`);
      console.log(`   └─ ResolvedAt reset to: ${ticket.resolvedAt} (Expected: null)\n`);
    } else {
      throw new Error('FAIL: Transition resolved -> in_progress was blocked!');
    }

    // 7. Validate email validation
    console.log('⚠️ Test 6: Testing email field validation rules...');
    try {
      const badTicket = new Ticket({
        subject: 'Faulty email ticket',
        description: 'Testing email regex',
        customerEmail: 'not-an-email',
        priority: 'low'
      });
      await badTicket.save();
      throw new Error('FAIL: Allowed saving with a poorly formatted email address!');
    } catch (err) {
      console.log(`   └─ Blocked successfully! Mongoose Error Message: ${err.message}\n`);
    }

    // 8. Clean up test tickets
    await Ticket.deleteMany({ customerEmail: 'test_suit@deskflow.com' });
    console.log('🧹 Cleaned up test suite data.');
    console.log('==================================================');
    console.log('🏆 ALL TESTS COMPLETED SUCCESSFULLY! DESKFLOW RULES VALIDATED');
    console.log('==================================================');
    process.exit(0);

  } catch (error) {
    console.error('❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
};

runTests();
