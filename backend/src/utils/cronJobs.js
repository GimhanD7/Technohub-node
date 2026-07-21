const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSMS } = require('./smsService');

const DEFAULT_BIRTHDAY_TIME = '08:00';
const DEFAULT_BIRTHDAY_MESSAGE = 'Happy Birthday {name}! Wishing you a fantastic day from TechnoHub!';

const initCronJobs = () => {
  // Check once per minute so an admin can change the delivery time without
  // restarting the backend. The timezone keeps the setting on Sri Lanka time.
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await prisma.system_settings.findUnique({
        where: { id: 1 },
        select: {
          birthday_sms_enabled: true,
          birthday_sms_time: true,
          birthday_sms_message: true
        }
      });

      // Keep the existing behaviour enabled until an admin explicitly turns it off.
      if (settings?.birthday_sms_enabled === false) {
        return;
      }

      const now = new Date();
      const currentTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);
      const configuredTime = settings?.birthday_sms_time || DEFAULT_BIRTHDAY_TIME;

      if (currentTime !== configuredTime) return;

      console.log('Running daily birthday SMS cron job...');

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
          const template = settings?.birthday_sms_message || DEFAULT_BIRTHDAY_MESSAGE;
          const message = template.replace(/\{name\}/gi, user.full_name);
          await sendSMS(user, message);
        }
      }
      
    } catch (error) {
      console.error('Error running daily birthday cron job:', error);
    }
  }, { timezone: 'Asia/Colombo', noOverlap: true });
};

module.exports = { initCronJobs };
