const fs = require('fs');
const path = require('path');

const projectRef = '[YOUR-PROJECT-ID]';
const anonKey = '[YOUR-ANON-KEY]';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== '.git' && file !== 'node_modules') {
        walk(fullPath);
      }
    } else {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;
        if (content.includes(projectRef)) {
          console.log(`Replacing projectRef in ${fullPath}`);
          content = content.split(projectRef).join('[YOUR-PROJECT-ID]');
          changed = true;
        }
        if (content.includes(anonKey)) {
          console.log(`Replacing anonKey in ${fullPath}`);
          content = content.split(anonKey).join('[YOUR-ANON-KEY]');
          changed = true;
        }
        if (changed) {
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      } catch (e) {
        // Skip files that can't be read as utf8
        // console.log(`Skipping ${fullPath}: ${e.message}`);
      }
    }
  }
}

console.log('Starting scrub...');
walk('.');
console.log('Scrub complete.');
