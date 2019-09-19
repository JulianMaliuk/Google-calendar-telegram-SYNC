# Google Calendar-Telegram Sync

## Синхронизация уведомлений с календарей Google для уведомлений в телеграм

---
## Зависимости

Для разработки вам понадобятся только Node.js и глобальный пакет узла Yarn, установленный в вашей среде.

### Node
- #### Node установка на Windows

  Переходим на [официальный сайт Node.js](https://nodejs.org/) и скачиваем установщик.
  Также убедитесь, что в вашей переменной PATH есть `git`, может понадобиться для `npm` (вы можете найти git [здесь](https://git-scm.com/)).

- #### Node установка на Ubuntu

  Вы можете легко установить nodejs и npm с помощью apt install, просто запустите следующие команды.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Другие операционные системы
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

Если установка прошла успешно, вы сможете выполнить следующую команду.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

Если вам нужно обновить `npm`, вы можете сделать это используя `npm`!

    $ npm install npm -g

###
### Yarn установка
  После установки node этому проекту также потребуется yarn, поэтому просто выполните следующую команду.

      $ npm install -g yarn

---

## Установка

    $ git clone https://Julian-maljuk@bitbucket.org/Julian-maljuk/google-calendar-telegram-sync.git
    $ cd google-calendar-telegram-sync
    $ yarn install

## Настройка

  ### Настройка доступа к календарю
  В [консоли google](https://developers.google.com/calendar/quickstart/nodejs) активируем Google Calendar API, скачиваем конфигурационный файл `credentials.json` и сохраняем его в корневой директории проекта.

  Переименовать файл `example.config.js` в `config.js`.
  Настроить календари (ID, название) и доступ telegramBOT (Token) в файле `config.js` по шаблону.

  ### Получение ID календарей для аккаунта:

    yarn getCalendarList

## Запуск

    $ yarn start

## Запуск в режиме разработки

    $ yarn dev