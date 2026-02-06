const fs = require('fs')
const path = require('path')

function readConfig() {
  const configPath = path.join(process.cwd(), 'config.json')
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  }
  return {}
}

function processData(input) {
  return input.toUpperCase()
}

module.exports = { readConfig, processData }
