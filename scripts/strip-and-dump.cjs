const fs = require('fs');
const path = require('path');

function loadTsAsObject(file) {
  let src = fs.readFileSync(file, 'utf8');
  // remove import lines
  src = src.replace(/^import[^\n]*\n/gm, '');
  // remove ": Type[]" / ": Type" / ": Record<...>" annotations on export const lines
  src = src.replace(/^export const (\w+)\s*:\s*[^=]+=/gm, 'const $1 = exports.$1 =');
  return src;
}

const dataDir = path.join(__dirname, '../src/data');
let code = '';
code += loadTsAsObject(path.join(dataDir, 'mockData.ts'));
code += '\n';
code += loadTsAsObject(path.join(dataDir, 'preorderData.ts'));

const moduleObj = { exports: {} };
const fn = new Function('exports', 'module', code);
fn(moduleObj.exports, moduleObj);

fs.writeFileSync(path.join(__dirname, 'mock-data.json'), JSON.stringify(moduleObj.exports, null, 2));
console.log('Keys:', Object.keys(moduleObj.exports));
console.log('Counts:', Object.fromEntries(Object.entries(moduleObj.exports).map(([k,v]) => [k, Array.isArray(v) ? v.length : typeof v])));
