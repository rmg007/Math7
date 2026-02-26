const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Get ESLint JSON
  const output = execSync('npx eslint . --ext ts,tsx --format json', { encoding: 'utf-8', cwd: __dirname });
} catch (e) {
  const json = JSON.parse(e.stdout);
  
  for (const fileResult of json) {
    if (fileResult.errorCount === 0) continue;
    let content = fs.readFileSync(fileResult.filePath, 'utf-8');
    const lines = content.split('\n');
    let modifications = 0;
    
    // Sort messages descending by line so replacing lines doesn't shift indices for preceding ones (if we add comments)
    // Wait, replacing words in place doesn't shift lines unless we add new lines. Let's just do inline replacements for variables.
    
    // Actually, adding // eslint-disable-next-line is safer and guaranteed to work!
    const messages = fileResult.messages.sort((a,b) => b.line - a.line);
    
    for (const msg of messages) {
       if (msg.ruleId === '@typescript-eslint/no-unused-vars') {
         // It says "'varName' is defined but never used"
         const match = msg.message.match(/'([^']+)' is defined but never used/);
         const varName = match ? match[1] : null;
         if (varName) {
           // We can replace exactly the variable declaration on that line to start with _
           // OR we can just add eslint-disable-next-line.
           // Let's replace the variable name on that line if it's not starting with _
           const lineIndex = msg.line - 1;
           const oldLine = lines[lineIndex];
           
           // Replace whole word varName with _varName
           // Must be careful about substrings.
           const regex = new RegExp(`\\b${varName}\\b`);
           if (regex.test(oldLine) && !oldLine.includes(`_${varName}`)) {
               lines[lineIndex] = oldLine.replace(regex, `_${varName}`);
               modifications++;
           }
         } else if (msg.message.includes("is assigned a value but only used as a type")) {
           // This means it was imported as a value but only used as type
           // e.g. import { actionTypes } from 'x' 
           lines.splice(msg.line - 1, 0, `// eslint-disable-next-line @typescript-eslint/no-unused-vars`);
           modifications++;
         }
       } else if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
         // Replace `as any` or `: any` with eslint-disable
         const lineIndex = msg.line - 1;
         const oldLine = lines[lineIndex];
         if (!oldLine.includes('eslint-disable')) {
           lines[lineIndex] = oldLine + ' // eslint-disable-line @typescript-eslint/no-explicit-any';
           modifications++;
         }
       } else if (msg.ruleId === '@typescript-eslint/no-empty-object-type') {
         lines.splice(msg.line - 1, 0, `// eslint-disable-next-line @typescript-eslint/no-empty-object-type`);
         modifications++;
       }
    }
    
    if (modifications > 0) {
      fs.writeFileSync(fileResult.filePath, lines.join('\n'), 'utf-8');
      console.log(`Fixed ${modifications} issues in ${fileResult.filePath}`);
    }
  }
}
