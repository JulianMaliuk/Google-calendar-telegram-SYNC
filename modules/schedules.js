const schedule = require('node-schedule');

const run = (app) => {
  // Sending a list of events for the current month on the 1st day at 9:00
  schedule.scheduleJob('0 9 1 * *', () => {
    app.events.getEventsAllAccount('same', {})
  });

  // Sending a list of events for the current month on the 15th at 9:00
  schedule.scheduleJob('0 9 15 * *', () => {
    app.events.getEventsAllAccount('same', {})
  });
}

module.exports = {
  run,
}