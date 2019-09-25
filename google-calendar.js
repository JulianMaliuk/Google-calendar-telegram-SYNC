const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var debug = require('debug')('app:google-calendar')

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

async function getCredentials() {
  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', async (err, content) => {
      if (err) {
        console.error('Error loading client secret file:', err);
        return reject('Error loading client secret file:', err);
      }
      resolve(JSON.parse(content))
    });
  })
}

async function getClient() {
  return new Promise(async (resolve, reject) => {
    const credentials = await getCredentials();
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
    fs.readFile(TOKEN_PATH, async (err, token) => {
      if (err) {
        const client = await getAccessToken(oAuth2Client);
        resolve(client);
      } else {
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      }
    });
  })
}

async function getAccessToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          return reject('Error retrieving access token');
        } else {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) {
              console.error(err);
            }
          });
          resolve(oAuth2Client);
        }
      });
    });
  })
}

async function fetchEvents(auth, timeMin, timeMax, opt) {
  return new Promise((resolve, reject) => {
    const calendar = google.calendar({version: 'v3', auth});
    const {calendarInfo} = opt;
    calendar.events.list({
      calendarId: calendarInfo.calendarID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) {
        debug('The API returned an error: ' + err)
        return reject('The API returned an error: ' + err);
      };
  
      const events = res.data.items;
      resolve(events);
    });
  })
}

async function fetchCalendarList(auth) {
  return new Promise((resolve, reject) => {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.calendarList.list({

    }, (err, res) => {
      if (err) {
        debug('The API returned an error: ' + err)
        return reject('The API returned an error: ' + err);
      };

      const calendarList = res.data.items;
      resolve(calendarList);
    });
  })
}

async function getOAuth2Client() {
  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', async (err, content) => {
      if (err) return reject('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Calendar API.
      const oAuth2Client = await gCalendar.authorize(JSON.parse(content));
      resolve(oAuth2Client);
    });
  })
}

exports.getClient = getClient;
exports.getAccessToken = getAccessToken;
exports.fetchEvents = fetchEvents;
exports.getOAuth2Client = getOAuth2Client;
exports.fetchCalendarList = fetchCalendarList;