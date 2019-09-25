const fs = require('fs');

function getOrCreateConfig() {
  try {
    const config = require('./config.json');
    return config;
  } catch (err) {
    const config = { GOOGLE_CALENDAR: [] } 
    if (err.code === 'MODULE_NOT_FOUND') {
      fs.writeFileSync(name, JSON.stringify(config, null, 1))
    }
    return config;
  }
}

module.exports = {
  getOrCreateConfig
};