const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSMS } = require('./smsService');

const initCronJobs = () => {
  // Run every day at 8:00 AM (0 8 * * *)
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily birthday SMS cron job...');
    try {
      // Find all users whose birthday is today
      // In MySQL, we can match DAY(birthdate) and MONTH(birthdate)
      const users = await prisma.$queryRaw`
        SELECT id, full_name, phone_number, birthdate 
        FROM users 
        WHERE birthdate IS NOT NULL 
          AND MONTH(birthdate) = MONTH(CURRENT_DATE()) 
          AND DAY(birthdate) = DAY(CURRENT_DATE())
      `;
      
      if (users.length === 0) {
        console.log('No birthdays today.');
        return;
      }
      
      console.log(`Found ${users.length} user(s) with a birthday today. Sending SMS...`);
      for (const user of users) {
        if (user.phone_number) {
          const message = `Happy Birthday ${user.full_name}! Wishing you a fantastic day from TechnoHub!`;
          await sendSMS(user, message);
        }
      }
      
    } catch (error) {
      console.error('Error running daily birthday cron job:', error);
    }
  });
};

module.exports = { initCronJobs };
