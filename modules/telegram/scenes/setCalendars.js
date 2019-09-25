const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const gCalendar = require('../../google/google-calendar');
const fs = require('fs');
const { calendarsHelper } = require('../commands')
var debug = require('debug')('app:setCalendar')

String.prototype.trunc = String.prototype.trunc ||
function(n){
    return (this.length > n) ? this.substr(0, n-1) + '...' : this;
};

const helperSubscribeCalendar = (ctx) => ctx.replyWithMarkdown('Для привязки еще одного аккаунта перешлите сообщение от пользователя или паблика, в который нужно рассылать сообщения. Для выхода перейдите по ссылке /exit')

const onEnterCalendar = async (ctx, app) => {
  // ctx.scene.session.user = {z:0};

  const auth = await gCalendar.getClient();
  const calendarList = await gCalendar.fetchCalendarList(auth);
  ctx.session.calendarList = calendarList

  return ctx.reply('Подвяжите или отвяжите календарь:', 
    Markup.inlineKeyboard([
      ...calendarList.map((calendar, index) => {
        const isSubscribed = app.calendars.some(c => c.calendarID === calendar.id);
        return [Markup.callbackButton(
          `${index+1}. ${isSubscribed ? 'Отвязать': 'Привязать'} ${calendar.summary.trunc(15)}`,
          `${isSubscribed ? 'unsubsribe': 'subsribe'} ${index}`
        )]
      }),
      [Markup.callbackButton('Отмена', 'exit')]
    ]).extra()
  )
}

const onActionSubscribe = (ctx, app, setCalendars) => {
  const index = ctx.match[1];
  const selectedCalendar = ctx.session.calendarList[index];
  ctx.session.selectedCalendar = selectedCalendar;
  debug(`Start Subscribe..`, selectedCalendar.summary)
  setCalendars.on('message', (ctx) => {
    const { forward_from_chat, forward_from, from } = ctx.message
    const reqChat = (forward_from_chat || forward_from || from)
    const reqChatTitle = reqChat.title || reqChat.username || reqChat.first_name || reqChat.id
    const selected = ctx.session.selectedCalendar;
    const isExistCalendarIndex = app.calendars.findIndex(c => c.calendarID === selected.id);
    debug('isExistCalendarIndex', isExistCalendarIndex)

    debug(`Add <${reqChatTitle}> to calendar <${selected.summary}>`)
    const chatInfo = {
      id: reqChat.id,
      title: reqChatTitle,
    }

    if(isExistCalendarIndex > -1) {
      app.calendars[isExistCalendarIndex].publics.push(chatInfo)
    } else {
      app.calendars.push({
        accountName: selected.summary,
        calendarID: selected.id,
        publics: [chatInfo],
      })
    }

    fs.readFile('./config/config.json', (err, data) => {
      if(!err) {
        const parsed = JSON.parse(data);
        parsed.GOOGLE_CALENDAR = app.calendars;
        fs.writeFile('./config/config.json', JSON.stringify(parsed, null, 2), err => {
          if(!err) {
            ctx.reply(`Аккаунт <${reqChatTitle}> привязан (календарь: <${selected.summary.toLocaleUpperCase()}>).`)
            helperSubscribeCalendar(ctx)
          }
        })
      }
    })
  })
  ctx.deleteMessage()
  return ctx.reply(`Перешлите любое сообщение из паблика, в который нужно рассылать сообщения.`)
}

const onActionUnsubscribe = (ctx, app) => {
  const index = ctx.match[1];
  const selectedCalendar = ctx.session.calendarList[index];
  debug(`unSubscribe calendar ${selectedCalendar.summary}`)
  ctx.deleteMessage()
  app.calendars = app.calendars.filter(calendar => calendar.calendarID !== selectedCalendar.id);
  ctx.session.calendars = app.calendars;
  fs.readFile('./config/config.json', (err, data) => {
    if(!err) {
      const parsed = JSON.parse(data);
      parsed.GOOGLE_CALENDAR = app.calendars;
      fs.writeFile('./config/config.json', JSON.stringify(parsed, null, 2), err => {
        if(!err) {
          ctx.reply(`Календарь <${selectedCalendar.summary.toLocaleUpperCase()}> отвязан.`)   
          return ctx.scene.leave();   
        }
      })
    }
  })
}

const onActionExit = async (ctx) => {
  await ctx.answerCbQuery();
  ctx.deleteMessage()
  await ctx.reply('Отменено')
  ctx.scene.leave()
}

onCommandExit = async (ctx) => {
  debug(`Exit from subscribe calendar.`)
  await ctx.reply('Сохранено.')
  return ctx.scene.leave()
}

module.exports = (app) => {
  const setCalendars = new Scene('setCalendars')
  setCalendars.enter(ctx => onEnterCalendar(ctx, app))
  setCalendars.action(/unsubsribe (.*)/, (ctx) => onActionUnsubscribe(ctx, app))
  setCalendars.action(/subsribe (.*)/, (ctx) => onActionSubscribe(ctx, app, setCalendars))
  setCalendars.leave(calendarsHelper)
  setCalendars.command('exit', onCommandExit)
  setCalendars.action('exit', onActionExit)
  // setCalendars.on('message', (ctx) => console.log(ctx.message.text))

  return setCalendars;
};