const fs = require('fs');
const path = require('path');

const modelsDir = path.resolve(__dirname, '../models');
const files = fs.readdirSync(modelsDir);

const reexports = files
  .filter((file) => file.endsWith('.model.ts'))
  .map((file) => `export * from './${file.replace('.ts', '')}';`)
  .join('\n');

fs.writeFileSync(path.resolve(modelsDir, 'index.ts'), reexports);

