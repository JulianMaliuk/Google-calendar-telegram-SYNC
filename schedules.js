const schedule = require('node-schedule');

const run = (app) => {
  //Отправка списка событий на текущий месяц 1го числа в 9:00
  schedule.scheduleJob('0 9 1 * *', () => {
    app.events.getEventsAllAccount('same', {})
  });

  //Отправка списка событий на текущий месяц 15го числа в 9:00
  schedule.scheduleJob('0 9 15 * *', () => {
    app.events.getEventsAllAccount('same', {})
  });
}

module.exports = {
  run,
}