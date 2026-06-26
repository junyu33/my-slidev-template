const fs = require('node:fs');
const path = require('node:path');

const enginesPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'gray-matter',
  'lib',
  'engines.js',
);

if (!fs.existsSync(enginesPath)) {
  process.exit(0);
}

let source = fs.readFileSync(enginesPath, 'utf8');
const patched = source
  .replace('parse: yaml.safeLoad.bind(yaml),', 'parse: yaml.load.bind(yaml),')
  .replace('stringify: yaml.safeDump.bind(yaml)', 'stringify: yaml.dump.bind(yaml)');

if (patched !== source) {
  fs.writeFileSync(enginesPath, patched);
}
