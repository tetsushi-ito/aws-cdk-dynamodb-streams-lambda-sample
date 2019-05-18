const fs = require('fs');
const path = require('path');

export const readFileContent = (dirname: string, filePath: string) => {
  const fullPath = path.resolve(dirname, filePath);
  return fs.readFileSync(fullPath, 'utf8');
};
