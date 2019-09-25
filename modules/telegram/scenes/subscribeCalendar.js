const Markup = require('telegraf/markup')
const Composer = require('telegraf/composer')
const WizardScene = require('telegraf/scenes/wizard')

const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
  return ctx.wizard.next()
})
stepHandler.command('next', (ctx) => {
  return ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'))

const subscribeWizard = new WizardScene('subscribe-wizard',
  (ctx) => {
    ctx.reply('Step 1', Markup.inlineKeyboard([
      Markup.urlButton('❤️', 'http://telegraf.js.org'),
      Markup.callbackButton('➡️ Next', 'Дальше')
    ]).extra())
    return ctx.wizard.next()
  },
  stepHandler,
  (ctx) => {
    ctx.reply('Step 3')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    return ctx.scene.leave()
  }
)

// const userWizard = new WizardScene('user-wizard',
//     (ctx) => {
//         ctx.reply("What is your name?");
//         ctx.scene.session.user = {};
//         ctx.scene.session.user.userId = ctx.update.callback_query.from.id;
//         return ctx.wizard.next();
//     },
//     (ctx) => {
//         if (ctx.message.text.length < 1 || ctx.message.text.length > 12) {
//             return ctx.reply("Name entered has an invalid length!");
//         }
//         ctx.scene.session.user.name = ctx.message.text;
//         ctx.reply("What is your last name?");
//         return ctx.wizard.next();
//     },
//     async (ctx) => {
//         if (ctx.message.text.length > 30) {
//             return ctx.reply("Last name has an invalid length");
//         }
//         ctx.scene.session.user.lastName = ctx.message.text;
//         await userController.StoreUser(ctx.scene.session.user);
//         return ctx.scene.leave(); //<- Leaving a scene will clear the session automatically
//     }
// );


module.exports = subscribeWizard;