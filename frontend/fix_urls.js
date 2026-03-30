const fs = require('fs');
const path = require('path');

const filesToFix = [
  'components/profile/SettingsTabs.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/profile/page.tsx',
  'app/dashboard/create/page.tsx',
  'app/dashboard/history/page.tsx'
];

filesToFix.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('Skipping ' + filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/"http:\/\/localhost:3001\/api([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}$1`');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed ' + relPath);
});
console.log('All hardcoded URLs fixed!');
