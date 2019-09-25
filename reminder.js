const { format, parseISO, addMilliseconds, isBefore, isEqual, differenceInDays,
  differenceInMilliseconds, isToday, isTomorrow} = require('date-fns');
const { ru } = require('date-fns/locale');
const { getEventDateFormat } = require('./helpers')
var debug = require('debug')('app:reminder')

module.exports = (app) => {
  const telegram = app.bot.telegram;

  function run() {
    setInterval(() => {
      const now = new Date();
      app.eventsForRemind = app.eventsForRemind.filter(reminder => {
        const {
          reminderDate,
          event
        } = reminder;
        if (isBefore(reminderDate, now) || isEqual(reminderDate, now)) {
          sendReminder(event, reminder);
          return false;
        }
    
        return true;
      })
    }, app.config.INTERVAL_SEND_MESSAGE * 1000)
  }

  function sendReminder(event, reminder) {
    debug(`summary: ${event.summary}`, 'now:', format(new Date(), 'dd.MM.yyyy HH:mm:ss'))
    const start = parseISO(event.start.dateTime || event.start.date);
    const end = parseISO(event.end.dateTime || event.end.date);
  
    let textDate = '';
  
    if (isToday(start)) {
      textDate = `СЕГОДНЯ:`
    } else if (isTomorrow(start)) {
      textDate = `ЗАВТРА:`
    } else {
      const diff = differenceInDays(start, new Date());
      textDate = `ЧЕРЕЗ (ДНЕЙ): ${diff}`
    }
  
    let eventText = '';
    const day = (format(start, 'dd-iiiiii.', {
      locale: ru
    })).toLocaleUpperCase();
    eventText += `*${textDate}*\n`;
    eventText += `*${reminder.accountName}*\n\n`;
    eventText += `*${day} ${event.summary} ${getEventDateFormat(start, end)}*`;
  
    console.log(`<${accountName.toLocaleUpperCase()}>`, 'Sending a reminder:', eventText, '<<>> to:', reminder.publics.map(public => public.id).join(', '));
    reminder.publics.forEach(public => {
      telegram.sendMessage(public.id, eventText, {
        parse_mode: 'Markdown'
      });
    })
  }

  function reminderSync() {
    app.events.getEventsAllAccount('reminder', {});
  
    const nextRequestAfterMiliseconds = differenceInMilliseconds(app.lastDateEvents, new Date()) - (30 * 1000);
    debug('next request after: ', nextRequestAfterMiliseconds / 1000, 'seconds;', format(addMilliseconds(new Date(), nextRequestAfterMiliseconds), 'dd.MM.yyyy HH:mm:ss'));
    setTimeout(reminderSync, nextRequestAfterMiliseconds);
  }

  return {
    sendReminder,
    reminderSync,
    run,
  }
}