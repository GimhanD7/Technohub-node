const fs=require('fs'); const files=[
'api/auth/login.php',
'api/db/config.php',
'api/db/migrate.php',
'api/quiz/edit.php',
'api/quiz/get.php',
'api/quiz/results.php',
'api/quiz/review.php',
'api/quiz/start_attempt.php',
'api/quiz/submissions.php',
'api/user/set_role.php',
'api/user/update_profile.php',
'src/app/dashboard/admin/layout.js',
'src/app/dashboard/admin/quiz-submissions/[id]/page.js',
'src/app/dashboard/admin/quizzes/page.js',
'src/app/dashboard/student/layout.js',
'src/app/dashboard/teacher/layout.js',
'src/app/dashboard/teacher/quiz-submissions/[id]/page.js',
'src/app/dashboard/teacher/quizzes/page.js',
'src/app/home/e-book/page.js',
'src/app/home/exam-hall/page.js',
'src/app/home/exam-hall/quiz/[id]/page.js'
];
let res = {};
files.forEach(f => {
  if(!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  let matches = [...content.matchAll(/<{7} HEAD\r?\n([\s\S]*?)={7}\r?\n([\s\S]*?)>{7} [a-f0-9]+\r?\n?/g)];
  if(matches.length > 0) {
    res[f] = matches.map(m => ({head: m[1], incoming: m[2]}));
  }
});
fs.writeFileSync('conflicts.json', JSON.stringify(res, null, 2));
