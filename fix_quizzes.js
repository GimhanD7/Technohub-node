const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/admin/quizzes/page.js', 'utf8');

// 1. Remove states
code = code.replace(/const \[selectedIds, setSelectedIds\] = useState\(\[\]\);\s*const \[isDeletingId, setIsDeletingId\] = useState\(null\);\s*const \[isBulkDeleting, setIsBulkDeleting\] = useState\(false\);/, 'const [isDeletingId, setIsDeletingId] = useState(null);');

// 2. Remove Selection Handlers
code = code.replace(/\/\/ Selection Handlers[\s\S]*?\/\/ Delete Handlers/, '// Delete Handlers');

// 3. Remove handleBulkDelete
code = code.replace(/const handleBulkDelete = \(\) => \{[\s\S]*?\/\/ Derived Data/, '// Derived Data');

// 4. Remove bulk delete UI block
code = code.replace(/\{selectedIds\.length > 0 && \([\s\S]*?\)\}/, '');

// 5. Remove checkbox column header
code = code.replace(/<th className="py-3 px-5 w-10">[\s\S]*?<\/th>\s*<th className="py-3 px-5 font-bold">Quiz<\/th>/, '<th className="py-3 px-5 font-bold">Quiz</th>');

// 6. Remove checkbox column body
code = code.replace(/<td className="py-3 px-5">\s*<input\s*type="checkbox"[\s\S]*?<\/td>\s*<td className="py-3 px-5">/, '<td className="py-3 px-5">');

// 7. Remove isSelected logic
code = code.replace(/const isSelected = selectedIds\.includes\(quiz\.id\);\s*return \(/, 'return (');

// 8. Remove selected background class logic
code = code.replace(/className=\{\`hover:bg-gray-50\/50 dark:hover:bg-slate-800\/50 dark:bg-slate-800\/50 transition-colors \$\{isSelected \? 'bg-blue-50\/50 dark:bg-blue-900\/10' : ''\}\`\}/, 'className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors"');

fs.writeFileSync('src/app/dashboard/admin/quizzes/page.js', code);
