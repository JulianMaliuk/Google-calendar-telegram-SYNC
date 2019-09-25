const { format, addDays, subSeconds, isEqual, isSameDay, startOfDay } = require('date-fns');
const { ru } = require('date-fns/locale');
const gCalendar = require('./google/google-calendar');

function isReminderAllDay(start, end) {
  return isEqual(end, startOfDay(end)) && isEqual(addDays(start, 1), end)
}

function isReminderManyDays(start, end) {
  return !isSameDay(start, subSeconds(end, 1))
}

function getEventDateFormat(start, end) {
 
  if (isReminderAllDay(start, end)) {
    return '';
  }

  if (isReminderManyDays(start, end)) {
    const isFullDays = !isSameDay(start, subSeconds(start, 1)) && !isSameDay(end, subSeconds(end, 1));
    const formatDate = isFullDays ? 'dd iiiiii' : 'dd iiiiii HH:mm'
    const _start = format(start, formatDate, {
      locale: ru
    }).toLocaleUpperCase();
    const _end = format(isFullDays ? subSeconds(end, 1) : end, formatDate, {
      locale: ru
    }).toLocaleUpperCase();
    return ` (${_start} - ${_end})`;
  }

  const _start = format(start, 'HH:mm', {
    locale: ru
  });
  const _end = format(end, 'HH:mm', {
    locale: ru
  });
  return ` (${_start}-${_end})`;
}

module.exports = {
  getEventDateFormat,
}