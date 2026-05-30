import * as fs from 'fs';
import * as path from 'path';

function findGits(dir: string) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (['proc', 'sys', 'dev', 'lib', 'lib64', 'bin', 'sbin', 'usr', 'etc', 'var', 'boot'].includes(f)) continue;
      const fullPath = path.join(dir, f);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (f === '.git') {
            console.log('Found .git repo at:', fullPath);
          } else {
            findGits(fullPath);
          }
        }
      } catch (e) {}
    }
  } catch (err) {}
}

console.log('Searching for any .git directory in the system...');
findGits('/');
