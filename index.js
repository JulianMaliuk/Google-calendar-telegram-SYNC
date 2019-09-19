const {format,parseISO,addMinutes,addDays,addMilliseconds,subSeconds,isBefore,isAfter,subMinutes,
        isEqual,isSameDay,differenceInDays,differenceInMilliseconds,isToday,isTomorrow,startOfDay,
        startOfMonth,endOfMonth,addMonths} = require('date-fns');
const { ru } = require('date-fns/locale');
const schedule = require('node-schedule');
const gCalendar = require('./google-calendar');
const config = require('./config');

const INTERVAL_SEND_MESSAGE = 10; //sec
const PERIOD_SYNC_CALENDAR = 5; //min
const IS_DEBUG = process.env.NODE_ENV === 'production' ? true : false;

let eventsForRemind = [];
let lastDateEvents = new Date(); 

const calendars = config.GOOGLE_CALENDAR;

/* TELEGRAM */
process.env.NTBA_FIX_319 = 1;
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

//Запрос событий на текущий месяц через телеграм бот
bot.onText(/\/same/, (msg, match) => {
  const chatId = msg.chat.id;  //ID пользователя,от которого пришел запрос
  getEventsAllAccount('same', {reqChatID: chatId})
});

//Запрос событий на следующий месяц через телеграм бот
bot.onText(/\/next/, (msg, match) => {
  const chatId = msg.chat.id; //ID пользователя,от которого пришел запрос
  getEventsAllAccount('next', {reqChatID: chatId})
});
/* TELEGRAM */

/* JOB */
//Отправка списка событий на текущий месяц 1го числа в 9:00
schedule.scheduleJob('0 9 1 * *', () => {
  getEventsAllAccount('same', {})
});

//Отправка списка событий на текущий месяц 15го числа в 9:00
schedule.scheduleJob('0 9 15 * *', () => {
  getEventsAllAccount('same', {})
});
/* JOB */

async function getEvents(type, opt) {
  try {
    const auth = await gCalendar.getClient();

    switch(type) {
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
      case 'reminder': { // ближайшие уведомления
        const events = await gCalendar.fetchEvents(auth, opt.lastDateEvents, addDays(opt.lastDateEvents, 30), opt);
        handlerNewEvents(events, opt);
        break;
      }
    }
  } catch(e) {
    debug('Error getEvents, next attempt..');
    getEvents(auth, type, opt);
  }
}

function sendEventsList(type, events, opt) {
  if (!events) return;
  const length = events.length;
  const {reqChatID, calendarInfo: { accountName, publicIDs }} = opt;
  const date = (type === 'same') ? new Date() : (type === 'next') ? addMonths(new Date(), 1): new Date();

  let eventsList = '';
  eventsList += `*СОБЫТИЯ ${(format(date, 'MMMM', {locale: ru})).toLocaleUpperCase()} ${format(date, 'yyyy', {locale: ru})}:*\n`;
  eventsList += `*${accountName}*\n\n`;

  if (length) {
    events.map((event, i) => {
      const start = parseISO(event.start.dateTime || event.start.date);
      const end = parseISO(event.end.dateTime || event.end.date);
      const day = (format(start, 'dd-iiiiii.', { locale: ru })).toLocaleUpperCase();
      eventsList += `*${day} ${event.summary} ${getDateFormat(start, end)}*\n\n`
    });

    if (reqChatID) { // Если был ручной запрос
      bot.sendMessage(reqChatID, eventsList, {parse_mode: 'Markdown'});
    } else { // При автоматическом запросе отправляем всем пабликам
      publicIDs.forEach(id => {
        bot.sendMessage(id, eventsList, {parse_mode: 'Markdown'});
      })
    }
  }
}

function handlerNewEvents(events, opt) {
  if (!events) return;
  const length = events.length;
  const {calendarInfo: { accountName, publicIDs }} = opt;
  if (length) {
    debug(`Upcoming ${length} events:`);
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      debug(`${format(parseISO(start), 'dd.MM.yyyy HH:mm:ss')} - ${event.summary}`);
      if (event.reminders && event.reminders.overrides) {
        event.reminders.overrides.forEach((reminder, i) => {
          const eventDate = parseISO(start);
          const reminderDate = subMinutes(eventDate, reminder.minutes);
          const isReminderInLastDateEvents = (isBefore(reminderDate, lastDateEvents) || isEqual(reminderDate, lastDateEvents)) && isAfter(reminderDate, new Date());

          debug(`<${accountName.toLocaleUpperCase()}>`, 'reminder:', i+1, '-', 'before', reminder.minutes, 'minutes');
          debug('reminderDate:', format(reminderDate ,'dd.MM.yyyy HH:mm:ss'));
          debug('lastDateEvents:', format(lastDateEvents ,'dd.MM.yyyy HH:mm:ss'));
          if(event.reminders.overrides.length > i+1) debug('---------------------------');

          if (isReminderInLastDateEvents) {
            eventsForRemind.push({
              reminderDate,
              event,
              publicIDs,
              accountName,
            })
            debug('---->>>>> new reminder:', event.summary)
          }  
        })
        debug('---------------------------');
      }
    });
  } else {
    debug('No upcoming events found.');
  }
}

function sendReminder(event, reminder) {
  debug(`summary: ${event.summary}`, 'now:', format(new Date(),'dd.MM.yyyy HH:mm:ss'))
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
  const day = (format(start, 'dd-iiiiii.', { locale: ru })).toLocaleUpperCase();
  eventText += `*${textDate}*\n`;
  eventText += `*${reminder.accountName}*\n\n`;
  eventText += `*${day} ${event.summary} ${getDateFormat(start, end)}*`;

  console.log(`<${accountName.toLocaleUpperCase()}>`, 'Sending a reminder:', eventText, '<<>> to:', reminder.publicIDs.join(', '));
  reminder.publicIDs.forEach(id => {
    bot.sendMessage(id, eventText, {parse_mode: 'Markdown'});
  })
}

setInterval(() => {
  const now = new Date();
  eventsForRemind = eventsForRemind.filter(reminder => {
    const { reminderDate, event } = reminder;
    if(isBefore(reminderDate, now) || isEqual(reminderDate, now)) {
      sendReminder(event, reminder);
      return false;
    }

    return true;
  })
}, INTERVAL_SEND_MESSAGE * 1000)


function isReminderAllDay(start, end) {
  return isEqual(end, startOfDay(end)) && isEqual(addDays(start, 1), end)
}

function isReminderManyDays(start, end) {
  return !isSameDay(start, subSeconds(end, 1))
}

function getDateFormat(start, end) {
  if (isReminderAllDay(start, end)) {
    return '';
  }

  if (isReminderManyDays(start, end)) {
    const isFullDays = !isSameDay(start, subSeconds(start, 1)) && !isSameDay(end, subSeconds(end, 1));
    const formatDate = isFullDays ? 'dd iiiiii' : 'dd iiiiii HH:mm'
    const _start = format(start, formatDate, { locale: ru }).toLocaleUpperCase();
    const _end = format(isFullDays ? subSeconds(end, 1): end, formatDate, { locale: ru }).toLocaleUpperCase();
    return ` (${_start} - ${_end})`;
  }

  const _start = format(start, 'HH:mm', { locale: ru });
  const _end = format(end, 'HH:mm', { locale: ru });
  return ` (${_start}-${_end})`; 
}

function getEventsAllAccount(type, opt) {
  const _lastDateEvents = lastDateEvents;
  if (type === 'reminder') {
    lastDateEvents = addMinutes(lastDateEvents, PERIOD_SYNC_CALENDAR);
  }

  calendars.forEach(calendarInfo => {
    getEvents(type, {
      calendarInfo,
      lastDateEvents: _lastDateEvents,
      ...opt
    })
  });
}

function debug() {
  if (IS_DEBUG) console.log.apply(console, arguments);
}

function startReminderSync() {
  getEventsAllAccount('reminder', {});

  const nextRequestAfterMiliseconds = differenceInMilliseconds(lastDateEvents, new Date()) - (30 * 1000);
  debug('next request after: ', nextRequestAfterMiliseconds / 1000, 'seconds;', format(addMilliseconds(new Date(), nextRequestAfterMiliseconds) ,'dd.MM.yyyy HH:mm:ss'));
  setTimeout(startReminderSync, nextRequestAfterMiliseconds);
}

(async () => {
  require('./getCalendarList');
  
  startReminderSync();
})()