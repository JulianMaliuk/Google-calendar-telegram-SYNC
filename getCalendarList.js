const gCalendar = require('./google-calendar');
require('console.table');

(async () => {
  const auth = await gCalendar.getClient();
  const calendarList = await gCalendar.fetchCalendarList(auth);

  const infoAccount = calendarList.map((calendar, index) => ({'Название': calendar.summary, 'ID': calendar.id, timeZone: calendar.timeZone}))
  console.log(`\n************************ Календари доступные для Вашего аккаунта ************************\n`)
  console.table(infoAccount);
})()