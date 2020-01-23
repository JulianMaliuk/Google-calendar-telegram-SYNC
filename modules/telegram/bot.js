const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { leave } = Stage
const { onCommandGetSameMonth, onCommandGetNextMonth, onCommandHelp, onCommanGetAllCalendars, onCommandGetMonth, onActionGetMonth } = require('./commands')
var debug = require('debug')('app:bot')

module.exports = (app) => {

  bot.use(async (ctx, next) => {
    await next()
    switch(ctx.updateType) {
      case 'message': {
        const { text, from: { username, first_name, id } } = ctx.message;
        debug(ctx.updateType, ' --->>', `<${username || first_name || id}>`, text); 
        break;
      }
      case 'callback_query': {
        const { from: { username, first_name, id }, message: { text }, data } = ctx.update.callback_query;
        debug(ctx.updateType, ' --->>', `<${username || first_name || id}>`, '| action:', data, '|', text); 
        break;
      }
    }
  })

  const stage = new Stage()
  stage.command('cancel', leave())
  const setCalendarsScene = require('./scenes/setCalendars')(app)
  stage.register(setCalendarsScene)

  bot.command('/h', onCommandHelp);
  bot.command('getAllCalendars', (ctx) => onCommanGetAllCalendars(ctx, app));
  bot.command('same_month', (ctx) => onCommandGetSameMonth(ctx, app));
  bot.command('next_month', (ctx) => onCommandGetNextMonth(ctx, app));
  bot.command('get_month', (ctx) => onCommandGetMonth(ctx, app));
  bot.action(/get_month (.*)/, (ctx) => onActionGetMonth(ctx, app));

  bot.use(session())
  bot.use(stage.middleware())

  bot.command('setCalendars', (ctx) => ctx.scene.enter('setCalendars'));
  // bot.on('message', (ctx) => console.log('msd'))

  bot.launch();

  app.bot = bot;
};