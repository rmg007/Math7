const fs = require('fs');
const path = require('path');

function processDir(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, f.name);
    // Skip node_modules and .git, etc.
    if (f.isDirectory() && f.name !== 'node_modules' && !f.name.startsWith('.')) {
      processDir(fullPath);
    } else if (f.isFile() && (f.name.endsWith('.ts') || f.name.endsWith('.tsx'))) {
      const orig = fs.readFileSync(fullPath, 'utf8');
      
      // Fix catch (e) => catch (_e) and similar
      let mod = orig.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g, (match, p1) => {
        if (p1.startsWith('_')) return match;
        return `catch (_${p1})`;
      });
      
      // We will leave 'as any' alone unless it's genuinely causing the failure 
      // where we manually just replace it with '// eslint-disable-line @typescript-eslint/no-explicit-any'
      
      if (orig !== mod) {
        fs.writeFileSync(fullPath, mod, 'utf8');
      }
    }
  }
}

// target specifically directories
processDir(path.join(__dirname, 'admin-panel/src'));
processDir(path.join(__dirname, 'admin-panel/tests'));

console.log('Done lint fix pass');
