var debug = require('debug')('app:')
const { getOrCreateConfig } = require('./config/getConfig');
const schedules = require('./modules/schedules')
const { getCalendarList } = require('./modules/google/google-calendar');
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

require('./modules/telegram/bot')(app);
require('./modules/events')(app);
const reminder = require('./modules/reminder')(app);

(async () => {
  await getCalendarList();
  reminder.reminderSync();
  reminder.run();
  schedules.run();
  debug('APP IS RUNNING')  
})();