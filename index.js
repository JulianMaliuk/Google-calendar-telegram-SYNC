var debug = require('debug')('app:')
const { getOrCreateConfig } = require('./config');
const schedules = require('./schedules')
require('dotenv').config();

const app = {
  config: {
    INTERVAL_SEND_MESSAGE: 10,  //sec
    PERIOD_SYNC_CALENDAR: 5,    //min
  },
  eventsForRemind: [],
  lastDateEvents: new Date(),
  calendars: getOrCreateConfig().GOOGLE_CALENDAR,
};

require('./telegram/bot')(app);
require('./events')(app);
const reminder = require('./reminder')(app);

(async () => {
  await require('./getCalendarList');
  reminder.reminderSync();
  reminder.run();
  schedules.run();
  debug('APP IS RUNNING')  
})();