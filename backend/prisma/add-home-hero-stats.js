const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const columns = [
  ["hero_stat_one_value", "VARCHAR(40) NOT NULL DEFAULT '6'"],
  ["hero_stat_one_label", "VARCHAR(120) NOT NULL DEFAULT 'Learner categories'"],
  ["hero_stat_two_value", "VARCHAR(40) NOT NULL DEFAULT '24/7'"],
  ["hero_stat_two_label", "VARCHAR(120) NOT NULL DEFAULT 'Resource access'"],
  ["hero_stat_three_value", "VARCHAR(40) NOT NULL DEFAULT 'Live'"],
  ["hero_stat_three_label", "VARCHAR(120) NOT NULL DEFAULT 'Classes and exams'"],
  ["feedback_heading", "VARCHAR(255) NOT NULL DEFAULT 'Learners trust focused, practical support.'"],
  ["feedback_items", "LONGTEXT NULL"],
  ["faq_items", "LONGTEXT NULL"],
];

const defaultFeedbackItems = [
  { name: "A/L ICT Student", role: "Advanced Level", quote: "The quizzes and video lessons helped me revise faster because everything was connected in one platform." },
  { name: "University Learner", role: "Software Foundation", quote: "The practical resources and e-books made it easier to prepare for assignments and project presentations." },
  { name: "Professional Learner", role: "Career Upskilling", quote: "The platform feels focused. I can follow lessons, check resources, and keep track of learning activities clearly." },
];

const defaultFaqItems = [
  { question: "Can different student categories use the platform?", answer: "Yes. Techno-Hub supports school, O/L, A/L, university, vocational, and professional learners with category-focused resources." },
  { question: "Are e-books and quizzes available online?", answer: "Yes. Students can access e-books, learning materials, quizzes, rankings, and exam practice from the platform." },
  { question: "Can I join live or online classes?", answer: "Yes. Online classes and guided sessions can be managed through the platform alongside recorded video lessons." },
  { question: "How do I contact the support team?", answer: "Use the Contact Us page to send a message or reach the education support team through the available contact details." },
];

async function main() {
  const existingColumns = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM home_settings");
  const existingNames = new Set(existingColumns.map((column) => column.Field));

  for (const [name, definition] of columns) {
    if (!existingNames.has(name)) {
      await prisma.$executeRawUnsafe(`ALTER TABLE home_settings ADD COLUMN ${name} ${definition}`);
    }
  }

  await prisma.$executeRawUnsafe(
    "UPDATE home_settings SET feedback_items = ? WHERE feedback_items IS NULL",
    JSON.stringify(defaultFeedbackItems)
  );
  await prisma.$executeRawUnsafe(
    "UPDATE home_settings SET faq_items = ? WHERE faq_items IS NULL",
    JSON.stringify(defaultFaqItems)
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
