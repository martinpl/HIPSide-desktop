'use strict';

const os = require('os');
const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;
const shell = electron.shell;
const ipcMain = electron.ipcMain;
const globalShortcut = electron.globalShortcut;
const BrowserWindow = electron.BrowserWindow;

global.baseURL = 'https://hipside.pl';
global.contextMenu;
global.appIcon;

let mainWindow;
let remain = true;

var Player;
var player;
var track;
var status;

if ( !app.requestSingleInstanceLock() )
{
	app.quit()
}
else
{
	const discord = require('./discord');

	function createMainWindow()
	{
		mainWindow = new BrowserWindow({
			icon: __dirname + '/assets/icon64.png',
			width: 1024,
			height: 768,
			minWidth: 340,
			minHeight: 180,
			backgroundColor: '#2B2B37',
			webPreferences: {
				preload: __dirname + '/preload.js',
			}
		});

		mainWindow.setMenuBarVisibility(false)
		mainWindow.loadURL(baseURL);

		// When closing, hide it instead
		mainWindow.on('close', (evt) => {
			if ( remain ) {
				evt.preventDefault();
				mainWindow.hide();
			} else {
				mainWindow = null;
			}
		});

		// Open link outside electron, Requires target="_blank"
		mainWindow.webContents.on('new-window', (e, url) => {
			  e.preventDefault();
			  shell.openExternal(url);
		});
	};

	function createAppIcon()
	{
		global.appIcon = new Tray(__dirname + '/assets/icon128.png');
		global.contextMenu = Menu.buildFromTemplate([
			{   label: 'Pokaż / Ukryj',
				click: () => {
					if (mainWindow.isVisible()) {
						mainWindow.hide();
					} else {
						mainWindow.show();
					}
				}
			},
			{   type: 'separator' },
			{   label: 'Odtwórz / Pauza',
				click: () => {
					mainWindow.webContents.executeJavaScript("player.playPause()");
				}
			},
			{   label: 'Następna',
				click: () => {
					mainWindow.webContents.executeJavaScript("player.next()");
				}
			},
			{   label: 'Poprzednia',
				click: () => {
					mainWindow.webContents.executeJavaScript("player.previous()");
				}
			},
			{   type: 'separator' },
			{
				label: 'Status Discord', 
				type: 'checkbox', 
				checked: true,
				click: () => { 
					discord.toggleDiscordStatus();
				}
			},
			{   type: 'separator' },
			{   label: 'Wyjdź',
				click: () => {
					remain = false;
					app.quit();
				}
			}
		]);
		appIcon.setContextMenu(contextMenu);
		appIcon.setToolTip('HIPSide');
		appIcon.on('click', (event) => {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
			}
		});

	};

	app.on('ready', () =>
	{
		createMainWindow();
		createAppIcon();

		// keyobard
		globalShortcut.register('MediaPreviousTrack', () => {
			mainWindow.webContents.executeJavaScript("player.previous()");
		})

		globalShortcut.register('MediaPlayPause', () => {
			mainWindow.webContents.executeJavaScript("player.playPause()");
		})

		globalShortcut.register('MediaNextTrack', () => {
			mainWindow.webContents.executeJavaScript("player.next()");
		})


		// mpris
		if( os.platform() == 'linux' )
		{
			Player = require('mpris-service');
			player = Player({
				name: 'hipside',
				identity: 'HIPSide',
				supportedInterfaces: ['player']
			});


			player.on('next', () => {
				mainWindow.webContents.executeJavaScript("player.next()");
			});

			player.on('previous', () => {
				mainWindow.webContents.executeJavaScript("player.previous()");
			});

			player.on('playpause', () => {
				mainWindow.webContents.executeJavaScript("player.playPause()");
			});
		}


		ipcMain.on('updateMeta', (event, newTrack) =>
		{
			track = newTrack;
			update();
		});

		ipcMain.on('updateStatus', (event, newStatus) =>
		{
			status = newStatus;
			update();
		});
	});

	app.on('window-all-closed', () => {
		app.quit();
	});

	function update()
	{
		if( os.platform() == 'linux' )
		{

			var https = require('https');
			var fs   = require('fs');

			var dir = app.getPath("temp") + '/HIPSide/';
			if (!fs.existsSync(dir)){
				fs.mkdirSync(dir);
			}

			var path = app.getPath("temp") + '/HIPSide/' + track.id + ".jpg";

			var file = fs.createWriteStream(path);
			var request = https.get( track.artwork[0].src, function(response) {
				var stream = response.pipe(file);
			
				stream.on('finish', function () { 
					player.metadata = {
						'mpris:artUrl': 'file://' + path,
						'xesam:title': track.title,
						'xesam:album': track.album,
						'xesam:artist': [track.artist],
					};

				});
			});

			if( status == true )
			{
				player.playbackStatus = 'Playing';
			}
			else
			{
				player.playbackStatus = 'Stopped';
			}
		}

	}
}