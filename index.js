// all the packages
var mysql = require('mysql');
var express = require('express');
const session = require('express-session');
const path = require("path");
const cal = require("./modules/calculations");
const duelcal = require("./modules/duelcalculations");
const api = require("./modules/api");
const sql = require("./modules/sql");
const cronjobs = require("./modules/cronjobs");
const { findSourceMap } = require('module');
const { table, Console } = require('console');
const { CONNREFUSED } = require('dns');
const port = 80;
const fs = require('fs');
const DiscordOauth2 = require("discord-oauth2");
const { resourceLimits } = require('worker_threads');
const oauth = new DiscordOauth2();
const Chart = require('chart.js');
const cron = require('node-cron');
const timestamp = require('unix-timestamp');
const apikey = 'ce196710-18e2-454a-aa57-2c357e1eb9da';
var app = express();

// sets up the webserver
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// updates and edits the accounts database
async function edit(req, res) {
  let data = req.body;
  let username = data.AdminUser;
  let db = await getAccountsDB();
  let newDB = [];
  let newData = [];
  const formData = req.body;

  // Loop through the form data and check the values of the delete checkboxes
  const usernamesToDelete = [];
  for (const key in formData) {
    if (key.startsWith('deleteCheckbox') && formData[key] === 'on') {
      // Extract the index from the key and push the corresponding username to the array
      const index = parseInt(key.replace('deleteCheckbox', ''));
      const username = formData[`NewAccountName${index}`];
      usernamesToDelete.push(username);
    }
  }

  if (usernamesToDelete != []) {
    for (let i = usernamesToDelete.length - 1; i >= 0;) {
      sql.connection.query(`delete from accounts where username="${usernamesToDelete[i]}"`);
    }
  }

  for (let i = 0; i < data.NewAccountName.length; i++) {
    newData.push([
      data.NewAccountName[i],
      data.Password[i],
      (data.AdminAccess[i] === 'true') ? 1 : 0
    ]);
  }

  for (let i = 0; i < newDB.length; i++) {
    if (newDB[i][0] !== newData[i][0] | newDB[i][2] !== newData[i][2]) {
      sql.connection.query(`update accounts set username="${newData[i][0]}", adminaccess=${newData[i][2]} where username="${newDB[i][0]}"`);
    }
    if (newDB[i][1] !== newData[i][1]) {
      sql.connection.query(`update accounts set passwordhash="${cal.hashCode(newData[i][1])}" where username="${newDB[i][0]}"`);
    }
  }

  let j = 0;
  for (let i = 0; i < newData.length; i++) {
    if (data['deleteCheckbox' + (i)]) { // Check if delete checkbox is selected
      accountsToDelete.push(newData[i][0]); // Add the account name to the list of accounts to delete
    }
  }
  admin(res, username[0]);
};

// post request to make sql commands
app.post('/sql', (req, res) => {
  let username = req.body.AdminUser;
  sql.connection.query(req.body.sqlCommand, (err, results) => {
    if (err) {
      res.render('pages/sql.ejs', {
        Sql: err
      });
    } else {
      res.send(results);
    }
  });
});

// post request to edit the database
app.post('/edit', (req, res) => {
  edit(req, res);
});

// post request to delete entries
app.post('/delete', (req, res) => {
  console.log(username);
  // sql.connection.query(`delete * where username="${username}"`);
  admin(res, req.body.AdminUser);
});

// renders webpage to let the user login
app.get('/login', (req, res) => {
  res.render('pages/login.ejs', {
    tryagain: '',
    login: true
  });
});

// renders webpage to let the user sign up
app.get('/signup', (req, res) => {
  res.render('pages/login.ejs', {
    tryagain: '',
    login: false
  });
});

// Change password request
app.post('/changepasswordrequest', (req, res) => {
  let username = req.body.username;
  let password = req.body.password_field;
  let passwordHash = cal.hashCode(password);
  sql.connection.query(`update accounts set passwordhash="${passwordHash}" where username="${username}"`);
  res.render('pages/login.ejs', {
    tryagain: 'password changes please login again',
    login: true
  });
});

// Link request
app.post('/link', (req, res) => {
  let username = req.body.username;
  let uuid = req.body.uuid;
  cronjobs.addPlayer(uuid, username);
  res.render('pages/login.ejs', {
    tryagain: 'account linked, please login again',
    login: true
  });
});

// post request which deals with logging in to accounts
app.post('/auth', (req, res) => {
  let username = req.body.name_field;
  let password = req.body.password_field;
  let passwordHash = cal.hashCode(password);
  sql.connection.query(`select * from accounts where username="${username}" and passwordhash="${passwordHash}"`, function (err, result, fields) {
    if (err) { console.log(err); }
    if (result == '') {
      res.render('pages/login.ejs', {
        tryagain: 'Try again, wrong username or password',
        login: true
      });
    } else {
      if (result[0].adminaccess == 0) {
        res.render('pages/account', {
          name: username
        });
      } else if (result[0].adminaccess == 1) {
        admin(res, username);
      }
    }
  });
});

// function that renders the admin panel
async function admin(res, username) {
  res.render('pages/admin', {
    name: username,
    AccountDB: await getAccountsDB()
  });
}

// function to get all the accounts database data
async function getAccountsDB() {
	return new Promise((resolve, reject) => {
		sql.connection.query(`select * from accounts`, function (err, result, fields) {
		  if (err) {
			reject(err);
		  } else {
			let array = [];
			for (let i = 0; i < result.length; i++) {
			  array.push([result[i].username, result[i].passwordhash, result[i].adminaccess]);
			}
			resolve(array);
		  }
		});
	  });
	  
	  // POST request that signs up an account and checks if a username already exists
	  app.post('/signup', (req, res) => {
		let username = req.body.name_field;
		let password = req.body.password_field;
		let passwordHash = cal.hashCode(password);
	  
		sql.connection.query(`select * from accounts where username="${username}"`, function (err, result, fields) {
		  if (result == '') {
			sql.connection.query(`insert into accounts (username, passwordhash, adminaccess) values ("${username}", "${passwordHash}", 0)`);
			res.render('pages/account', {
			  name: username
			});
		  } else {
			res.render('pages/login', {
			  tryagain: 'That username already exists',
			  login: false
			});
		  }
		});
	  });
	  
	  app.get('/', function(req, res) {
		res.render('index.ejs');
	  });
	  
	  // Loads the Patch Notes
	  app.get('/PatchNotes', function(req, res) {
		res.render('pages/PatchNotes.ejs');
	  });
	  
	  // Loads the main stats page
	  app.get('/p/:player', function(request, response) {
		Duels(request, response);
	  });
	  
	  async function Duels(request, response) {
    var username = request.params.player;
    var recordedstats = await getStatRecordsDB(username);

    // Gets the information from the Hypixel API
    api.FindUUID(username) // Finds the player's ID from the Mojang API
        .then(UUID => {
            console.log(UUID);
            if (UUID == `/users/profiles/minecraft/${username}`) { // Case if the player doesn't exist
                response.render('pages/error');
            } else {
                api.FindUUID(username)
                    .then(UUID => {
                        api.GetPlayerData(UUID) // Gets data from the Hypixel API
                            .then(playerdata => {
                                let datalist = Object.values(playerdata);
                                let duel = datalist[1].stats.Duels;
                                if (duel == undefined) {
                                    response.render('pages/error');
                                } else {
                                    let games = [
                                        ['Blitz', 'blitz_duel_wins', duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), cal.commaNumb(duel.blitz_duel_wins), cal.commaNumb(duel.blitz_duel_losses), cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_wins, duel.blitz_duel_losses), 2)), cal.commaNumb(duel.blitz_duel_kills), cal.commaNumb(duel.blitz_duel_deaths), cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_kills, duel.blitz_duel_deaths), 2)), cal.commaNumb(duel.current_winstreak_mode_blitz_duel), cal.commaNumb(duel.best_winstreak_mode_blitz_duel), duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1), ''],
                                        ['Boxing', 'boxing_duel_wins', duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), cal.commaNumb(duel.boxing_duel_wins), cal.commaNumb(duel.boxing_duel_losses), cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_wins, duel.boxing_duel_losses), 2)), cal.commaNumb(duel.boxing_duel_kills), cal.commaNumb(duel.boxing_duel_deaths), cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_kills, duel.boxing_duel_deaths), 2)), cal.commaNumb(duel.current_winstreak_mode_boxing_duel), cal.commaNumb(duel.best_winstreak_mode_boxing_duel), duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1), ''],
                                        ['Bow', 'bow_duel_wins', duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), cal.commaNumb(duel.bow_duel_wins), cal.commaNumb(duel.bow_duel_losses), cal.commaNumb(cal.dp(cal.WinLoss(duel.bow_duel_wins, duel.bow_duel_losses), 2)), cal.commaNumb(duel.bow_duel_kills), cal.commaNumb(duel.bow_duel_deaths), cal.commaNumb(cal.dp(cal.WinLoss(duel.bow_duel_kills, duel.bow_duel_deaths), 2)), cal.commaNumb(duel.current_winstreak_bow), cal.commaNumb(duel.best_winstreak_bow), duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1), ''],
                                        ['Blitz', 'blitz_duel_wins', duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), cal.commaNumb(duel.blitz_duel_wins), cal.commaNumb(duel.blitz_duel_losses), cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_wins, duel.blitz_duel_losses), 2)), cal.commaNumb(duel.blitz_duel_kills), cal.commaNumb(duel.blitz_duel_deaths), cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_kills, duel.blitz_duel_deaths), 2)), cal.commaNumb(duel.current_winstreak_mode_blitz_duel), cal.commaNumb(duel.best_winstreak_mode_blitz_duel), duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1), ''],
                                        ['Boxing', 'boxing_duel_wins', duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), cal.commaNumb(duel.boxing_duel_wins), cal.commaNumb(duel.boxing_duel_losses), cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_wins, duel.boxing_duel_losses), 2)), cal.commaNumb(duel.boxing_duel_kills), cal.commaNumb(duel.boxing_duel_deaths), cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_kills, duel.boxing_duel_deaths), 2)), cal.commaNumb(duel.current_winstreak_mode_boxing_duel), cal.commaNumb(duel.best_winstreak_mode_boxing_duel), duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1), ''],
										['Bridge', 'bridge_duel_wins', duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins, duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins, duel.capture_threes_wins, 0),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_wins, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_losses, duel.bridge_doubles_losses,
										duel.bridge_threes_losses, duel.bridge_four_losses, duel.bridge_2v2v2v2_losses, duel.bridge_3v3v3v3_losses,
										duel.capture_threes_losses)),
										cal.commaNumb(cal.dp(cal.WinLoss((duelcal.addup(duel.bridge_duel_wins,
										duel.bridge_doubles_wins, duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins,
										duel.bridge_3v3v3v3_wins, duel.capture_threes_wins)), (duelcal.addup(duel.bridge_duel_losses,
										duel.bridge_doubles_losses, duel.bridge_threes_losses, duel.bridge_four_losses, duel.bridge_2v2v2v2_losses,
										duel.bridge_3v3v3v3_losses, duel.capture_threes_losses))), 2)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_kills, duel.bridge_doubles_kills,
										duel.bridge_threes_kills, duel.bridge_four_kills, duel.bridge_2v2v2v2_kills, duel.bridge_3v3v3v3_kills,
										duel.capture_threes_kills, 0, 0)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_deaths, duel.bridge_doubles_deaths,
										duel.bridge_threes_deaths, duel.bridge_four_deaths, duel.bridge_2v2v2v2_deaths, duel.bridge_3v3v3v3_deaths,
										duel.capture_threes_deaths)),
										cal.commaNumb(cal.dp(cal.WinLoss((duelcal.addup(duel.bridge_duel_kills,
										duel.bridge_doubles_kills, duel.bridge_threes_kills, duel.bridge_four_kills, duel.bridge_2v2v2v2_kills,
										duel.bridge_3v3v3v3_kills, duel.capture_threes_kills)), (duelcal.addup(duel.bridge_duel_deaths,
										duel.bridge_doubles_deaths, duel.bridge_threes_deaths, duel.bridge_four_deaths, duel.bridge_2v2v2v2_deaths,
										duel.bridge_3v3v3v3_deaths, duel.capture_threes_deaths))), 2)),
										cal.commaNumb(duel.duels_bridge_win_streak),
										cal.commaNumb(duel.best_winstreak_mode_bridge_duels),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Main']
										['Blitz', 'blitz_duel_wins',
										duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.blitz_duel_wins),
										cal.commaNumb(duel.blitz_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_wins, duel.blitz_duel_losses),
										2)),
										cal.commaNumb(duel.blitz_duel_kills),
										cal.commaNumb(duel.blitz_duel_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.blitz_duel_kills, duel.blitz_duel_deaths),
										2)),
										cal.commaNumb(duel.current_winstreak_mode_blitz_duel),
										cal.commaNumb(duel.best_winstreak_mode_blitz_duel),
										duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										'', 
										['Boxing', 'boxing_duel_wins',
										duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.boxing_duel_wins),
										cal.commaNumb(duel.boxing_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_wins,
										duel.boxing_duel_losses), 2)),
										cal.commaNumb(duel.boxing_duel_kills),
										cal.commaNumb(duel.boxing_duel_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.boxing_duel_kills,
										duel.boxing_duel_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_boxing_duel),
										cal.commaNumb(duel.best_winstreak_mode_boxing_duel),
										duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										'',
										],
										['Bow', 'bow_duel_wins',
										duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.bow_duel_wins),
										cal.commaNumb(duel.bow_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bow_duel_wins, duel.bow_duel_losses), 2)),
										cal.commaNumb(duel.bow_duel_kills),
										cal.commaNumb(duel.bow_duel_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bow_duel_kills, duel.bow_duel_deaths),
										2)),
										cal.commaNumb(duel.current_winstreak_bow),
										cal.commaNumb(duel.best_winstreak_bow),
										duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										'',
										],
										['Bowspleef', 'bowspleef_duel_wins',
										duelcal.getdivision(duel.bowspleef_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.bowspleef_duel_wins),
										cal.commaNumb(duel.bowspleef_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bowspleef_duel_wins,
										duel.bowspleef_duel_losses), 2)),
										0,
										cal.commaNumb(duel.bowspleef_duel_deaths),
										0,
										cal.commaNumb(duel.current_winstreak_bowspleef),
										cal.commaNumb(duel.best_winstreak_bowspleef),
										duelcal.getdivision(duel.bowspleef_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										'',
										],
										['Bridge', 'bridge_duel_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_wins, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_losses, duel.bridge_doubles_losses,
										duel.bridge_threes_losses, duel.bridge_four_losses, duel.bridge_2v2v2v2_losses, duel.bridge_3v3v3v3_losses,
										duel.capture_threes_losses)),
										cal.commaNumb(cal.dp(cal.WinLoss((duelcal.addup(duel.bridge_duel_wins,
										duel.bridge_doubles_wins, duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins,
										duel.bridge_3v3v3v3_wins, duel.capture_threes_wins)), (duelcal.addup(duel.bridge_duel_losses,
										duel.bridge_doubles_losses, duel.bridge_threes_losses, duel.bridge_four_losses, duel.bridge_2v2v2v2_losses,
										duel.bridge_3v3v3v3_losses, duel.capture_threes_losses))), 2)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_kills, duel.bridge_doubles_kills,
										duel.bridge_threes_kills, duel.bridge_four_kills, duel.bridge_2v2v2v2_kills, duel.bridge_3v3v3v3_kills,
										duel.capture_threes_kills, 0, 0)),
										cal.commaNumb(duelcal.addup(duel.bridge_duel_deaths, duel.bridge_doubles_deaths,
										duel.bridge_threes_deaths, duel.bridge_four_deaths, duel.bridge_2v2v2v2_deaths, duel.bridge_3v3v3v3_deaths,
										duel.capture_threes_deaths)),
										cal.commaNumb(cal.dp(cal.WinLoss((duelcal.addup(duel.bridge_duel_kills,
										duel.bridge_doubles_kills, duel.bridge_threes_kills, duel.bridge_four_kills, duel.bridge_2v2v2v2_kills,
										duel.bridge_3v3v3v3_kills, duel.capture_threes_kills)), (duelcal.addup(duel.bridge_duel_deaths,
										duel.bridge_doubles_deaths, duel.bridge_threes_deaths, duel.bridge_four_deaths, duel.bridge_2v2v2v2_deaths,
										duel.bridge_3v3v3v3_deaths, duel.capture_threes_deaths))), 2)),
										cal.commaNumb(duel.duels_bridge_win_streak),
										cal.commaNumb(duel.best_winstreak_mode_bridge_duels),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Main',
										],
										['Bridge 1v1', 'bridge_duel_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_duel_wins),
										cal.commaNumb(duel.bridge_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_duel_wins,
										duel.bridge_duel_losses), 2)),
										cal.commaNumb(duel.bridge_duel_bridge_kills),
										cal.commaNumb(duel.bridge_duel_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_duel_kills,
										duel.bridge_duel_deaths), 2)),
										cal.commaNumb(duel.current_bridge_win_streak),
										cal.commaNumb(duel.best_winstreak_bridge_duels),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'
										],
										['Bridge 2v2', 'bridge_doubles_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_doubles_wins),
										cal.commaNumb(duel.bridge_doubles_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_doubles_wins,
										duel.bridge_doubles_losses), 2)),
										cal.commaNumb(duel.bridge_doubles_bridge_kills),
										cal.commaNumb(duel.bridge_doubles_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_doubles_bridge_kills,
										duel.bridge_doubles_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_doubles),
										cal.commaNumb(duel.best_winstreak_mode_bridge_doubles),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'
										],
										['Bridge 3v3', 'bridge_threes_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_threes_wins),
										cal.commaNumb(duel.bridge_threes_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_threes_wins,
										duel.bridge_threes_losses), 2)),
										cal.commaNumb(duel.bridge_threes_bridge_kills),
										cal.commaNumb(duel.bridge_threes_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_threes_bridge_kills,
										duel.bridge_threes_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_threes),
										cal.commaNumb(duel.best_winstreak_mode_bridge_threes),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'],
										['Bridge 4v4', 'bridge_four_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_four_wins),
										cal.commaNumb(duel.bridge_four_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_four_wins,
										duel.bridge_four_losses), 2)),
										cal.commaNumb(duel.bridge_four_bridge_kills),
										cal.commaNumb(duel.bridge_four_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_four_bridge_kills,
										duel.bridge_four_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_four),
										cal.commaNumb(duel.best_winstreak_mode_bridge_four),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'],
										['Bridge 2v2v2v2', 'bridge_2v2v2v2_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_2v2v2v2_wins),
										cal.commaNumb(duel.bridge_2v2v2v2_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_2v2v2v2_wins,
										duel.bridge_2v2v2v2_losses), 2)),
										cal.commaNumb(duel.bridge_2v2v2v2_bridge_kills),
										cal.commaNumb(duel.bridge_2v2v2v2_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_2v2v2v2_bridge_kills,
										duel.bridge_2v2v2v2_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_2v2v2v2),
										cal.commaNumb(duel.best_winstreak_mode_bridge_2v2v2v2),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'],
										['Bridge 3v3v3v3', 'bridge_3v3v3v3_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.bridge_3v3v3v3_wins),
										cal.commaNumb(duel.bridge_3v3v3v3_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_3v3v3v3_wins,
										duel.bridge_3v3v3v3_losses), 2)),
										cal.commaNumb(duel.bridge_3v3v3v3_bridge_kills),
										cal.commaNumb(duel.bridge_3v3v3v3_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.bridge_3v3v3v3_bridge_kills,
										duel.bridge_3v3v3v3_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_3v3v3v3),
										cal.commaNumb(duel.best_winstreak_mode_bridge_3v3v3v3),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'],
										['Bridge CTF', 'capture_threes_wins',
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0),
										cal.commaNumb(duel.capture_threes_wins),
										cal.commaNumb(duel.capture_threes_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.capture_threes_wins,
										duel.capture_threes_losses), 2)),
										cal.commaNumb(duel.capture_threes_bridge_kills),
										cal.commaNumb(duel.capture_threes_bridge_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.capture_threes_bridge_kills,
										duel.capture_threes_bridge_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_bridge_threes),
										cal.commaNumb(duel.best_winstreak_mode_bridge_threes),
										duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 1),
										'Sub'],
										['Classic', 'classic_duel_wins',
										duelcal.getdivision(duel.classic_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.classic_duel_wins),
										cal.commaNumb(duel.classic_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.classic_duel_wins,
										duel.classic_duel_losses), 2)),
										cal.commaNumb(duel.classic_duel_kills),
										cal.commaNumb(duel.classic_duel_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.classic_duel_kills,
										duel.classic_duel_deaths), 2)),
										cal.commaNumb(duel.current_winstreak_mode_classic_duel),
										cal.commaNumb(duel.best_winstreak_mode_classic_duel),
										duelcal.getdivision(duel.classic_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										''],
										['Combo', 'combo_duel_wins',
										duelcal.getdivision(duel.combo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
										cal.commaNumb(duel.combo_duel_wins),
										cal.commaNumb(duel.combo_duel_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.combo_duel_wins, duel.combo_duel_losses),
										2)),
										cal.commaNumb(duel.combo_duel_kills),
										cal.commaNumb(duel.combo_duel_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.combo_duel_kills, duel.combo_duel_deaths),
										2)),
										cal.commaNumb(duel.current_winstreak_mode_combo_duel),
										cal.commaNumb(duel.best_winstreak_mode_combo_duel),
										duelcal.getdivision(duel.combo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
										''],
										['Duel Arena', 'duel_arena_wins',
										'',
										cal.commaNumb(duel.duel_arena_wins),
										cal.commaNumb(duel.duel_arena_losses),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.duel_arena_wins, duel.duel_arena_losses),
										2)),
										cal.commaNumb(duel.duel_arena_kills),
										cal.commaNumb(duel.duel_arena_deaths),
										cal.commaNumb(cal.dp(cal.WinLoss(duel.duel_arena_kills, duel.duel_arena_deaths),
										2)),
										[1.25, duelcal.addup(duel.bowspleef_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'BowSpleef Main'],
										[2, duelcal.addup(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
										duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
										duel.capture_threes_wins, 0), 
										'Bridge Main'],
										[1, duelcal.addup(duel.classic_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'Classic Main'],
										[1.75, duelcal.addup(duel.combo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'Combo Main'],
										[1.75, duelcal.addup(duel.mw_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'MegaWalls Main'],
										[2, duelcal.addup(duel.potion_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'NoDebuff Main'],
										[1.5, duelcal.addup(duel.op_doubles_wins, 1, duel.op_duel_wins, 0, 0, 0, 0, 0, 0),
										'Op Main'],
										[2.5, duelcal.addup(duel.parkour_eight_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'Parkour Main'],
										[1.5, duelcal.addup(duel.sw_doubles_wins, 1, duel.sw_duel_wins, 0, 0, 0, 0, 0, 0),
										'Skywars Main'],
										[1, duelcal.addup(duel.sumo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0), 'Sumo main EWWWW'],
										[1.5, duelcal.addup(duel.uhc_duel_wins, 1, duel.uhc_doubles_wins,
										duel.uhc_four_wins, duel.uhc_meetup_wins, 0, 0, 0, 0), 'UHC Main']]]]
										var largest = 0;
										for (i=0; i<values.length; i++){
											if ((values[i][0] * values[i][1])>largest) {
												largest=(values[i][0] * values[i][1]);
												MainTitle = values[i][2]
											}
										}
										for (let o = 0; o < divtable.length; o++) {
											for (let p = 0; p < divtable.length; p++) {
												if (divtable[p][2] == undefined) {
												divtable.splice(p, 1)
										}
										}
										for (let p = 0; p < divtable.length; p++) {
											if (divtable[p][1] == 'I') {
												divtable[p][1] = '';}
											}}
												divtable.sort(compareSecondColumn)
												let tablerows = []
										for (let i = 0; i < games.length; i++) {
						if ((games[i][3] == 0 || games[i][3] == undefined) || (games[i][4] == 0 || games[i]
						[4] == undefined)) {
						} else {
						tablerows.push(games[i])
						}
						}
						let playerrank = duelcal.getrank(datalist[1])
						if (playerrank == undefined) { playerrank = ['', '', '', 'GREY', 'GREY', 'GREY', 'GREY',
						'', '', '', ''] }
						let div = duelcal.getdivision(datalist[1].stats.Duels.wins, 2, 0, 0, 0, 0, 0, 0, 3)
						if (div == undefined) {
						div = [0, 0, 0]
						}
						let otherInfo = [
						datalist[1].achievementPoints,
						datalist[1].firstLogin,
						datalist[1].lastLogin,
						datalist[1].lastLogout,
						datalist[1].karma,
						]
						const month = 730
						const week = 168
						const day = 24
						const hour = 1
						if (recordedstats.length > day + 1 ) {
						var RecorededDaily = [
						[recordedstats[recordedstats.length - day].BlitzWins,
						recordedstats[recordedstats.length - day].BlitzLosses],
						[recordedstats[recordedstats.length - day].BowWins,
						recordedstats[recordedstats.length - day].BowLosses],
						[recordedstats[recordedstats.length - day].BowspleefWins,
						recordedstats[recordedstats.length - day].BowspleefLosses],
						[recordedstats[recordedstats.length - day].BoxingWins,
						recordedstats[recordedstats.length - day].BoxingLosses],
						[recordedstats[recordedstats.length - day].BridgeWins,
						recordedstats[recordedstats.length - day].BridgeLosses],
						[recordedstats[recordedstats.length - day].ClassicWins,
						recordedstats[recordedstats.length - day].ClassicLosses],
						[recordedstats[recordedstats.length - day].ComboWins,
						recordedstats[recordedstats.length - day].ComboLosses],
						[recordedstats[recordedstats.length - day].DuelArenaWins,
						recordedstats[recordedstats.length - day].DuelArenaLosses],
						[recordedstats[recordedstats.length - day].MegaWallsWins,
						recordedstats[recordedstats.length - day].MegaWallsLosses],
						[recordedstats[recordedstats.length - day].NoDebuffWins,
						recordedstats[recordedstats.length - day].NoDebuffLosses],
						[recordedstats[recordedstats.length - day].OPWins,
						recordedstats[recordedstats.length - day].OPLosses],
						[recordedstats[recordedstats.length - day].SumoWins,
						recordedstats[recordedstats.length - day].SumoLosses],
						[recordedstats[recordedstats.length - day].SkywarsWins,
						recordedstats[recordedstats.length - day].SkywarsLosses],
						[recordedstats[recordedstats.length - day].UHCWins,
						recordedstats[recordedstats.length - day].UHCLosses],
						[recordedstats[recordedstats.length - day].ParkourWins,
						recordedstats[recordedstats.length - day].ParkourLosses],
						]
						} else {var RecorededDaily = 'Not Enough Data Try Again Later'}
						if (recordedstats.length > month + 1 ) {
						var RecorededMonthy = [
						[recordedstats[recordedstats.length - month].BlitzWins,
						recordedstats[recordedstats.length - month].BlitzLosses],
						[recordedstats[recordedstats.length - month].BowWins,
						recordedstats[recordedstats.length - month].BowLosses],
						[recordedstats[recordedstats.length - month].BowspleefWins,
						recordedstats[recordedstats.length - month].BowspleefLosses],
						[recordedstats[recordedstats.length - month].BoxingWins,
						recordedstats[recordedstats.length - month].BoxingLosses],
						[recordedstats[recordedstats.length - month].BridgeWins,
						recordedstats[recordedstats.length - month].BridgeLosses],
						[recordedstats[recordedstats.length - month].ClassicWins,
						recordedstats[recordedstats.length - month].ClassicLosses],
						[recordedstats[recordedstats.length - month].ComboWins,
						recordedstats[recordedstats.length - month].ComboLosses],
						[recordedstats[recordedstats.length - month].DuelArenaWins,
						recordedstats[recordedstats.length - month].DuelArenaLosses],
						[recordedstats[recordedstats.length - month].MegaWallsWins,
						recordedstats[recordedstats.length - month].MegaWallsLosses],
						[recordedstats[recordedstats.length - month].NoDebuffWins,
						recordedstats[recordedstats.length - month].NoDebuffLosses],
						[recordedstats[recordedstats.length - month].OPWins,
						recordedstats[recordedstats.length - month].OPLosses],
						[recordedstats[recordedstats.length - month].SumoWins,
						recordedstats[recordedstats.length - month].SumoLosses],
						[recordedstats[recordedstats.length - month].SkywarsWins,
						recordedstats[recordedstats.length - month].SkywarsLosses],
						[recordedstats[recordedstats.length - month].UHCWins,
						recordedstats[recordedstats.length - month].UHCLosses],
						[recordedstats[recordedstats.length - month].ParkourWins,
						recordedstats[recordedstats.length - month].ParkourLosses],
						]
						} else {var RecorededMonthy = 'Not Enough Data Try Again Later'}
						if (recordedstats.length > week + 1 ) {
						var RecorededWeekly = [
						[recordedstats[recordedstats.length - week].BlitzWins,
						recordedstats[recordedstats.length - week].BlitzLosses],
						[recordedstats[recordedstats.length - week].BowWins,
						recordedstats[recordedstats.length - week].BowLosses],
						[recordedstats[recordedstats.length - week].BowspleefWins,
						recordedstats[recordedstats.length - week].BowspleefLosses],
						[recordedstats[recordedstats.length - week].BoxingWins,
						recordedstats[recordedstats.length - week].BoxingLosses],
						[recordedstats[recordedstats.length - week].BridgeWins,
						recordedstats[recordedstats.length - week].BridgeLosses],
						[recordedstats[recordedstats.length - week].ClassicWins,
						recordedstats[recordedstats.length - week].ClassicLosses],
						[recordedstats[recordedstats.length - week].ComboWins,
						recordedstats[recordedstats.length - week].ComboLosses],
						[recordedstats[recordedstats.length - week].DuelArenaWins,
						recordedstats[recordedstats.length - week].DuelArenaLosses],
						[recordedstats[recordedstats.length - week].MegaWallsWins,
						recordedstats[recordedstats.length - week].MegaWallsLosses],
						[recordedstats[recordedstats.length - week].NoDebuffWins,
						recordedstats[recordedstats.length - week].NoDebuffLosses],
						[recordedstats[recordedstats.length - week].OPWins,
						recordedstats[recordedstats.length - week].OPLosses],
						[recordedstats[recordedstats.length - week].SumoWins,
						recordedstats[recordedstats.length - week].SumoLosses],
						[recordedstats[recordedstats.length - week].SkywarsWins,
						recordedstats[recordedstats.length - week].SkywarsLosses],
						[recordedstats[recordedstats.length - week].UHCWins,
						recordedstats[recordedstats.length - week].UHCLosses],
						[recordedstats[recordedstats.length - week].ParkourWins,
						recordedstats[recordedstats.length - week].ParkourLosses],
						]
						} else {var RecorededWeekly = 'Not Enough Data Try Again Later'}
						if (recordedstats.length > hour + 1 ) {
						var RecorededHourly = [
						[recordedstats[recordedstats.length - hour].BlitzWins,
						recordedstats[recordedstats.length - hour].BlitzLosses],
						[recordedstats[recordedstats.length - hour].BowWins,
						recordedstats[recordedstats.length - hour].BowLosses],
						[recordedstats[recordedstats.length - hour].BowspleefWins,
						recordedstats[recordedstats.length - hour].BowspleefLosses],
						[recordedstats[recordedstats.length - hour].BoxingWins,
						recordedstats[recordedstats.length - hour].BoxingLosses],
						[recordedstats[recordedstats.length - hour].BridgeWins,
						recordedstats[recordedstats.length - hour].BridgeLosses],
						[recordedstats[recordedstats.length - hour].ClassicWins,
						recordedstats[recordedstats.length - hour].ClassicLosses],
						[recordedstats[recordedstats.length - hour].ComboWins,
						recordedstats[recordedstats.length - week].ComboLosses],
						[recordedstats[recordedstats.length - hour].DuelArenaWins,
						recordedstats[recordedstats.length - hour].DuelArenaLosses],
						[recordedstats[recordedstats.length - hour].MegaWallsWins,
						recordedstats[recordedstats.length - hour].MegaWallsLosses],
						[recordedstats[recordedstats.length - hour].NoDebuffWins,
						recordedstats[recordedstats.length - hour].NoDebuffLosses],
						[recordedstats[recordedstats.length - hour].OPWins,
						recordedstats[recordedstats.length - hour].OPLosses],
						[recordedstats[recordedstats.length - hour].SumoWins,
						recordedstats[recordedstats.length - hour].SumoLosses],
						[recordedstats[recordedstats.length - hour].SkywarsWins,
						recordedstats[recordedstats.length - hour].SkywarsLosses],
						[recordedstats[recordedstats.length - hour].UHCWins,
						recordedstats[recordedstats.length - hour].UHCLosses],
						[recordedstats[recordedstats.length - hour].ParkourWins,
						recordedstats[recordedstats.length - hour].ParkourLosses],
						]
						} else {var RecorededHourly = 'Not Enough Data Try Again Later'}
						var RecorededStatsTable = [
						['Blitz',
						duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.blitz_duel_wins),
						(duel.blitz_duel_losses),
						duelcal.getdivision(duel.blitz_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Bow',
						duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.bow_duel_wins),
						(duel.bow_duel_losses),
						duelcal.getdivision(duel.bow_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Bowspleef',
						duelcal.getdivision(duel.bowspleef_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.bowspleef_duel_wins),
						(duel.bowspleef_duel_losses),
						duelcal.getdivision(duel.bowspleef_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Boxing',
						duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.boxing_duel_wins),
						(duel.boxing_duel_losses),
						duelcal.getdivision(duel.boxing_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Bridge',
						duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
						duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
						duel.capture_threes_wins, 0),
						(duelcal.addup(duel.bridge_duel_wins, duel.bridge_doubles_wins,
						duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
						duel.capture_threes_wins)),
						(duelcal.addup(duel.bridge_duel_losses, duel.bridge_doubles_losses,
						duel.bridge_threes_losses, duel.bridge_four_losses, duel.bridge_2v2v2v2_losses, duel.bridge_3v3v3v3_losses,
						duel.capture_threes_losses)),
						duelcal.getdivision(duel.bridge_duel_wins, 1, duel.bridge_doubles_wins,
						duel.bridge_threes_wins, duel.bridge_four_wins, duel.bridge_2v2v2v2_wins, duel.bridge_3v3v3v3_wins,
						duel.capture_threes_wins, 1),
						],
						['Classic',
						duelcal.getdivision(duel.classic_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.classic_duel_wins),
						(duel.classic_duel_losses),
						duelcal.getdivision(duel.classic_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Combo',
						duelcal.getdivision(duel.combo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.combo_duel_wins),
						(duel.combo_duel_losses),
						duelcal.getdivision(duel.combo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Duel Arena',
						'',
						(duel.duel_arena_wins),
						(duel.duel_arena_losses),
						'',
						],
						['MegaWalls',
						duelcal.getdivision(duel.mw_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.mw_duel_wins),
						(duel.mw_duel_losses),
						duelcal.getdivision(duel.mw_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['NoDebuff',
						duelcal.getdivision(duel.potion_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.potion_duel_wins),
						(duel.potion_duel_losses),
						duelcal.getdivision(duel.potion_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['Op',
						duelcal.getdivision(duel.op_duel_wins, 1, duel.op_doubles_wins, 0, 0, 0, 0, 0,
						0),
						(duelcal.addup(duel.op_duel_wins, duel.op_doubles_wins, 0, 0, 0, 0, 0)),
						(duelcal.addup(duel.op_duel_losses, duel.op_doubles_losses, 0, 0, 0, 0, 0)),
						duelcal.getdivision(duel.op_duel_wins, 1, duel.op_doubles_wins, 0, 0, 0, 0, 0,
						1),
						],
						['Skywars',
						duelcal.getdivision(duel.sw_duel_wins, 1, duel.sw_doubles_wins, 0, 0, 0, 0, 0,
						0),
						cal.commaNumb(duelcal.addup(duel.sw_duel_wins, duel.sw_doubles_wins, 0, 0, 0, 0,
						0)),
						cal.commaNumb(duelcal.addup(duel.sw_duel_losses, duel.sw_doubles_losses, 0, 0, 0,
						0, 0)),
						duelcal.getdivision(duel.sw_duel_wins, 1, duel.sw_doubles_wins, 0, 0, 0, 0, 0,
						1),
						],
						['Sumo',
						duelcal.getdivision(duel.sumo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.sumo_duel_wins),
						(duel.sumo_duel_losses),
						duelcal.getdivision(duel.sumo_duel_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						['UHC',
						duelcal.getdivision(duel.uhc_duel_wins, 1, duel.uhc_doubles_wins,
						duel.uhc_meetup_wins, duel.uhc_four_wins, 0, 0, 0, 0),
						(duelcal.addup(duel.uhc_duel_wins, duel.uhc_doubles_wins, duel.uhc_meetup_wins,
						duel.uhc_four_wins, 0, 0, 0)),
						(duelcal.addup(duel.uhc_duel_losses, duel.uhc_doubles_losses,
						duel.uhc_meetup_losses, duel.uhc_four_losses, 0, 0, 0)),
						duelcal.getdivision(duel.uhc_duel_wins, 1, duel.uhc_doubles_wins,
						duel.uhc_meetup_wins, duel.uhc_four_wins, 0, 0, 0, 1),
						],
						['Parkour',
						duelcal.getdivision(duel.parkour_eight_wins, 1, 0, 0, 0, 0, 0, 0, 0),
						(duel.parkour_eight_wins),
						(duel.parkour_eight_losses),
						duelcal.getdivision(duel.parkour_eight_wins, 1, 0, 0, 0, 0, 0, 0, 1),
						],
						]
						var HourlyTable = [[]]
						if (RecorededHourly != Object) {
						for (let i = 0; i < RecorededStatsTable.length; i++) {
						HourlyTable.push([
						RecorededStatsTable[i][0],
						cal.commaNumb(RecorededStatsTable[i][1]),
						cal.commaNumb(RecorededStatsTable[i][2] - RecorededHourly[i][0]),
						cal.commaNumb(RecorededStatsTable[i][3] - RecorededHourly[i][1]),
						cal.commaNumb(cal.dp(cal.WinLoss(cal.commaNumb(RecorededStatsTable[i][2] -
						RecorededHourly[i][0])),(cal.commaNumb(RecorededStatsTable[i][3] - RecorededHourly[i][1])))),
						RecorededStatsTable[i][4],
						])
						}
						} else {HourlyTable.push(['Not Enough Data Try Again Later'])}
						var DailyTable = [[]]
						if (RecorededDaily != Object) {
						for (let i = 0; i < RecorededStatsTable.length; i++) {
						DailyTable.push([
						RecorededStatsTable[i][0],
						cal.commaNumb(RecorededStatsTable[i][1]),
						cal.commaNumb(RecorededStatsTable[i][2] - RecorededDaily[i][0]),
						cal.commaNumb(RecorededStatsTable[i][3] - RecorededDaily[i][1]),
						cal.commaNumb(cal.dp(cal.WinLoss(cal.commaNumb(RecorededStatsTable[i][2] -
						RecorededDaily[i][0])),(cal.commaNumb(RecorededStatsTable[i][3] - RecorededDaily[i][1])))),
						RecorededStatsTable[i][4],
						])
						}
						} else {DailyTable.push(['Not Enough Data Try Again Later'])}
						var WeeklyTable = [[]]
						if (RecorededWeekly != Object) {
						for (let i = 0; i < RecorededStatsTable.length; i++) {
						WeeklyTable.push([
						RecorededStatsTable[i][0],
						cal.commaNumb(RecorededStatsTable[i][1]),
						cal.commaNumb(RecorededStatsTable[i][2] - RecorededWeekly[i][0]),
						cal.commaNumb(RecorededStatsTable[i][3] - RecorededWeekly[i][1]),
						cal.commaNumb(cal.dp(cal.WinLoss(cal.commaNumb(RecorededStatsTable[i][2] -
						RecorededWeekly[i][0])),(cal.commaNumb(RecorededStatsTable[i][3] - RecorededWeekly[i][1])))),
						RecorededStatsTable[i][4],
						])
						}
						} else {WeeklyTable.push(['Not Enough Data Try Again Later'])}
						var MonthlyTable = [[]]
						if (RecorededMonthy != Object) {
						for (let i = 0; i < RecorededStatsTable.length; i++) {
						MonthlyTable.push([
						RecorededStatsTable[i][0],
						cal.commaNumb(RecorededStatsTable[i][1]),
						cal.commaNumb(RecorededStatsTable[i][2] - RecorededMonthy[i][0]),
						cal.commaNumb(RecorededStatsTable[i][3] - RecorededMonthy[i][1]),
						cal.commaNumb(cal.dp(cal.WinLoss(cal.commaNumb(RecorededStatsTable[i][2] -
						RecorededMonthy[i][0])),(cal.commaNumb(RecorededStatsTable[i][3] - RecorededMonthy[i][1])))),
						RecorededStatsTable[i][4],
						])
						}
						} else {MonthlyTable.push(['Not Enough Data Try Again Later'])}
						var cdata = [5, 10, 15];
						var clabels = ['label 1', 'label 2', 'label 3']
						// renders the page to the browser
						response.render('pages/duels', {
						info: otherInfo,
						user: username,
						rank: playerrank,
						wl: cal.commaNumb(cal.WinLoss(duel.wins, duel.losses), 0),
						allranks: ['[VIP]', '[VIP+]', '[MVP]', '[MVP+]', '[MVP++]', '[YOUTUBER]'],
						wins: cal.commaNumb(datalist[1].stats.Duels.wins),
						rows: tablerows,
						overalldivision: div,
						link: `https://crafatar.com/renders/body/${UUID}?helm`,
						dtb: divtable,
						dtv: [1, 2, 3, 4, 5],
						main: MainTitle,
						data: cdata,
						labels: clabels,
						recordedstats: recordedstats,
						recordedstatstable: RecorededStatsTable,
						RecorededDaily: DailyTable,
						RecorededWeekly: WeeklyTable,
						RecorededMonthly: MonthlyTable,
						RecorededHourly: HourlyTable,
						})
						}
						})
						})
						}
						})
						}
						function compareSecondColumn(a, b) {
						if (a[4] === b[4]) {
						return 0;
						}
						else {
						return (a[4] > b[4]) ? -1 : 1;
						}
						}
						async function getUUIDFromUsername(username) {
						const UUID = await api.FindUUID(username);
						return UUID;
						}
						async function getStatRecordsDB(username) {
						const uuid = await getUUIDFromUsername(username)
						try {
							const results = await new Promise((resolve, reject) => {
								sql.connection.query(`select * from StatRecords where UUID='${uuid}'`, (error, results, fields) => {
						if (error) {
						reject(error);
						} else {
						resolve(results);
						}
						});
						});
						return (results);
						} catch (error) {
						console.error(`getStatRecordsDB error: ${error}`);
						return null;
						}
						}
						// hosts the server
						app.listen(port);
						console.log('Server started at http://localhost:' + port);
						// regularrly schedules stat recording every hour
						cron.schedule('* * * * *', () => {
						recorddata()
						});
						function recorddata() {
						sql.connection.query("select * from StatRecords where type='First'", function (err, res, fields) {
						for (let i = 0; i < res.length; i++) {
						api.GetPlayerData(res[i].UUID)
						.then(playerdata => {
						let datalist = (Object.values(playerdata))
						let data = datalist[1].stats.Duels
						let wins = [
						data.wins,
						data.blitz_duel_wins,
						data.boxing_duel_wins,
						data.bow_duel_wins,
						data.bowspleef_duel_wins,
						(data.bridge_2v2v2v2_wins + data.bridge_3v3v3v3_wins + data.bridge_doubles_wins +
						data.bridge_duel_wins + data.bridge_four_wins + data.bridge_threes_wins + data.capture_threes_wins),
						data.classic_duel_wins,
						data.combo_duel_wins,
						data.duel_arena_wins,
						data.mw_duel_wins,
						data.potion_duel_wins,
						(data.op_doubles_wins + data.op_duel_wins),
						(data.sw_duel_wins + data.sw_doubles_wins),
						data.sumo_duel_wins,
						(data.uhc_meetup_wins + data.uhc_four_wins + data.uhc_duel_wins +
						data.uhc_doubles_wins),
						data.parkour_eight_wins,
						]
						let losses = [
						data.losses,
						data.blitz_duel_losses,
						data.boxing_duel_losses,
						data.bow_duel_losses,
						data.bowspleef_duel_losses,
						(data.bridge_2v2v2v2_losses + data.bridge_3v3v3v3_losses +
						data.bridge_doubles_losses + data.bridge_duel_losses + data.bridge_four_losses + data.bridge_threes_losses +
						data.capture_threes_losses),
						data.classic_duel_losses,
						data.combo_duel_losses,
						data.duel_arena_losses,
						data.mw_duel_losses,
						data.potion_duel_losses,
						(data.op_doubles_losses + data.op_duel_losses),
						(data.sw_duel_losses + data.sw_doubles_losses),
						data.sumo_duel_losses,
						(data.uhc_four_losses + data.uhc_duel_losses + data.uhc_doubles_losses),
						data.parkour_eight_losses,
						]
						for (i = 0; i < wins; i++) {
						if (wins[i] == undefined) {
						wins[i] = 0
						}
						}
						for (i = 0; i < losses; i++) {
						if (losses[i] == undefined) {
						losses[i] = 0
						}
						}
						let sqlQuery = `insert into StatRecords (Username, UUID, TimeStamp, Type, Wins, Losses,
						BlitzWins, BlitzLosses, BoxingWins, BoxingLosses, BowWins, BowLosses, BowSpleefWins, BowSpleefLosses,
						BridgeWins, BridgeLosses, ClassicWins, ClassicLosses, ComboWins, ComboLosses, DuelArenaWins,
						DuelArenaLosses, MegaWallsWins, MegaWallsLosses, NoDebuffWins, NoDebuffLosses, OpWins, OpLosses, SumoWins,
						SumoLosses, SkywarsWins, SkywarsLosses, UHCWins, UHCLosses, ParkourWins, ParkourLosses) values
						('${res[i].username}', '${res[i].UUID}', ${timestamp.now()}, 'Hour', '${wins[0]}', '${losses[0]}',
						'${wins[1]}', '${losses[1]}', '${wins[2]}', '${losses[2]}', '${wins[3]}', '${losses[3]}', '${wins[4]}',
						'${losses[4]}', '${wins[5]}', '${losses[5]}', '${wins[6]}', '${losses[6]}', '${wins[7]}', '${losses[7]}',
						'${wins[8]}', '${losses[8]}', '${wins[9]}', '${losses[9]}', '${wins[10]}', '${losses[10]}', '${wins[11]}',
						'${losses[11]}', '${wins[12]}', '${losses[12]}', '${wins[13]}', '${losses[13]}', '${wins[14]}',
						'${losses[14]}', '${wins[15]}', '${losses[15]}' )`
						sql.connection.query(sqlQuery)
						})
						}
						});
					}}