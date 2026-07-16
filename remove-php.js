const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace .php in fetchApi and fetch calls. 
    // Example: fetchApi('/admin/security.php') -> fetchApi('/admin/security')
    // We can just safely replace '.php' with '' inside strings that look like API endpoints.
    // For safety, replace '.php' followed by quote, question mark, or backtick.
    const originalContent = content;
    
    content = content.replace(/\.php([`"'\?])/g, '$1');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
});
