const { format, parseISO, addMinutes, addDays, isBefore, isAfter, subMinutes, 
  isEqual, startOfDay, startOfMonth, endOfMonth, addMonths} = require('date-fns');
const { ru } = require('date-fns/locale');
const gCalendar = require('./google/google-calendar');
const { getEventDateFormat } = require('./helpers')
var debug = require('debug')('app:events')

module.exports = (app) => {

  function getEventsAllAccount(type, opt) {
    const lastDateEvents = app.lastDateEvents;
    if (type === 'reminder') {
      app.lastDateEvents = addMinutes(app.lastDateEvents, app.config.PERIOD_SYNC_CALENDAR);
    }
  
    app.calendars.forEach(calendarInfo => {
      getEvents(type, {
        calendarInfo,
        lastDateEvents,
        ...opt
      })
    });
  }

  async function getEvents(type, opt) {
    try {
      const auth = await gCalendar.getClient();
  
      switch (type) {
        case 'same': { // текущий месяц
          const now = new Date();
          const start = now.getDate() === 15 ? startOfDay(now) : startOfMonth(now);
          const events = await gCalendar.fetchEvents(auth, start, endOfMonth(now), opt);
          sendEventsList(type, events, opt);
          break;
        }
        case 'next': { // следующий месяц
          const next = addMonths(new Date(), 1);
          const events = await gCalendar.fetchEvents(auth, startOfMonth(next), endOfMonth(next), opt);
          sendEventsList(type, events, opt);
          break;
        }
        case 'month': { // с указанием месяца
          const date = new Date().setMonth(opt.month);
          const events = await gCalendar.fetchEvents(auth, startOfMonth(date), endOfMonth(date), opt);
          sendEventsList(type, events, opt);
          break;
        }
        case 'reminder': { // ближайшие уведомления
          const events = await gCalendar.fetchEvents(auth, opt.lastDateEvents, addDays(opt.lastDateEvents, 30), opt);
          handlerNewEvents(events, opt);
          break;
        }
      }
    } catch (e) {
      debug('Error getEvents, next attempt..', e);
      getEvents(type, opt);
    }
  }
  
  function sendEventsList(type, events, opt) {
    const telegram = app.bot.telegram;
    if (!events || !events.length) return;
    const length = events.length;
    const {
      reqChatID,
      calendarInfo: {
        accountName,
        publics
      }
    } = opt;

    const start = events[0].start;
    const startDate = start.date || start.dateTime;
    const date = new Date(startDate);
  
    let eventsList = '';
    eventsList += `*СОБЫТИЯ ${(format(date, 'MMMM', {locale: ru})).toLocaleUpperCase()} ${format(date, 'yyyy', {locale: ru})}:*\n`;
    eventsList += `${'`'}<${accountName}>${'`'}\n\n`;
  
    if (length) {
      events.map((event, i) => {
        const start = parseISO(event.start.dateTime || event.start.date);
        const end = parseISO(event.end.dateTime || event.end.date);
        const day = (format(start, 'dd-iiiiii.', {
          locale: ru
        })).toLocaleUpperCase();
        eventsList += `*${day} ${event.summary} ${getEventDateFormat(start, end)}*\n\n`
      });
  
      if (reqChatID) { // Если был ручной запрос
        telegram.sendMessage(reqChatID, eventsList, {
          parse_mode: 'Markdown'
        });
      } else { // При автоматическом запросе отправляем всем пабликам
        publics.forEach(public => {
          telegram.sendMessage(public.id, eventsList, {
            parse_mode: 'Markdown'
          });
        })
      }
    }
  }
  
  function handlerNewEvents(events, opt) {
    if (!events) return;
    const length = events.length;
    const {
      calendarInfo: {
        accountName,
        publics
      }
    } = opt;
    if (length) {
      debug(`<${accountName}>  --  Upcoming ${length} events:`);
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        debug(`${format(parseISO(start), 'dd.MM.yyyy HH:mm:ss')} - ${event.summary}`);
        if (event.reminders && event.reminders.overrides) {
          event.reminders.overrides.forEach((reminder, i) => {
            const eventDate = parseISO(start);
            const reminderDate = subMinutes(eventDate, reminder.minutes);
            const isReminderInLastDateEvents = (isBefore(reminderDate, app.lastDateEvents) || isEqual(reminderDate, app.lastDateEvents)) && isAfter(reminderDate, new Date());
  
            debug(`<${accountName.toLocaleUpperCase()}>`, 'reminder:', i + 1, '-', 'before', reminder.minutes, 'minutes');
            debug('reminderDate:', format(reminderDate, 'dd.MM.yyyy HH:mm:ss'));
            debug('lastDateEvents:', format(app.lastDateEvents, 'dd.MM.yyyy HH:mm:ss'));
            if (event.reminders.overrides.length > i + 1) debug('---------------------------');
  
            if (isReminderInLastDateEvents) {
              app.eventsForRemind.push({
                reminderDate,
                event,
                publics,
                accountName,
              })
              debug('---->>>>> new reminder:', event.summary)
            }
          })
          debug('---------------------------');
        }
      });
    } else {
      debug(`<${accountName}>  --  No upcoming events found.`);
    }
  }

  app.events = {
    getEventsAllAccount,
  }

  return app.events;
}