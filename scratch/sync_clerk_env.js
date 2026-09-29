const fs = require('fs');
const path = require('path');

const frontendEnvPath = path.resolve('../frontend/.env.local');
const backendEnvPath = path.resolve('.env');

if (fs.existsSync(frontendEnvPath) && fs.existsSync(backendEnvPath)) {
  const fContent = fs.readFileSync(frontendEnvPath, 'utf8');
  let bContent = fs.readFileSync(backendEnvPath, 'utf8');

  const pubMatch = fContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.*)/);
  const secMatch = fContent.match(/CLERK_SECRET_KEY=(.*)/);

  if (pubMatch && !bContent.includes('CLERK_PUBLISHABLE_KEY=')) {
    bContent += `\nCLERK_PUBLISHABLE_KEY="${pubMatch[1].trim()}"`;
  }
  if (secMatch && !bContent.includes('CLERK_SECRET_KEY=')) {
    bContent += `\nCLERK_SECRET_KEY="${secMatch[1].trim()}"`;
  }
  if (!bContent.includes('FRONTEND_URL=')) {
    bContent += `\nFRONTEND_URL="http://localhost:3000"`;
  }

  fs.writeFileSync(backendEnvPath, bContent, 'utf8');
  console.log('Successfully synced Clerk keys to backend/.env');
} else {
  console.log('Files not found');
}
