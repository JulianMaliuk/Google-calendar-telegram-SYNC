const gCalendar = require('../google-calendar');
const Markup = require('telegraf/markup');
const { localize } = require('date-fns/locale/ru');

const onCommandGetSameMonth = (ctx, app) => {
  const chatId = ctx.message.chat.id; //ID пользователя,от которого пришел запрос
  app.events.getEventsAllAccount('same', {
    reqChatID: chatId
  })
}

const onCommandGetNextMonth = (ctx, app) => {
  const chatId = ctx.message.chat.id; //ID пользователя,от которого пришел запрос
  app.events.getEventsAllAccount('next', {
    reqChatID: chatId
  })
}

const onCommandHelp = (ctx) => {
  const reply = [];
  reply.push('/getAllCalendars - список календарей');
  reply.push('/setCalendars - настройки календарей');

  ctx.reply(reply.join('\n'))
}

const onCommanGetAllCalendars = async (ctx, app) => {
  const auth = await gCalendar.getClient();
  const calendarList = await gCalendar.fetchCalendarList(auth);
  let response = 'Календари:\n\n'
  function getStatusSubscribe(calendar) {
    const isSubcribedIndex = app.calendars.findIndex(c => c.calendarID === calendar.id)
    if(isSubcribedIndex > -1) {
      const publics = app.calendars[isSubcribedIndex].publics;
      const titles = publics.map(public => `${public.title}`).join(', ')
      return '`(Привязан ' + '[' + titles + '])`'
    }
    return ''
  }
  response += calendarList.map((calendar, index) => `${index+1}. ${calendar.summary} ${getStatusSubscribe(calendar)}`).join(',\n');
  ctx.replyWithMarkdown(response);
  calendarsHelper(ctx);
}

const calendarsHelper = (ctx) => ctx.reply('Для настройки (привязки/отвязки) перейдите по ссылке /setCalendars')

const onCommandGetMonth = (ctx) => {

  function getButtons(months) {
    return months.map(key => {
      const title = localize.month(key);
      const numberOfMonth = key;
      return Markup.callbackButton(title, `get_month ${numberOfMonth}`)
    })
  }

  return ctx.reply('Выберите месяц:', 
    Markup.inlineKeyboard([
      getButtons([0,1,2]),
      getButtons([3,4,5]),
      getButtons([6,7,8]),
      getButtons([9,10,11]),
    ]).extra()
  )
}

const onActionGetMonth = async (ctx, app) => {
  await ctx.answerCbQuery();
  ctx.deleteMessage()
  const chatId = ctx.update.callback_query.from.id;
  const monthSelected = parseInt(ctx.match[1]);
  app.events.getEventsAllAccount('month', {
    reqChatID: chatId,
    month: monthSelected,
  })
}

module.exports = {
  calendarsHelper,
  onCommandGetSameMonth,
  onCommandGetNextMonth,
  onCommandHelp,
  onCommanGetAllCalendars,
  onCommandGetMonth,
  onActionGetMonth,
}