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

let mainWindow;
let appIcon;
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
	function createMainWindow ()
	{
		mainWindow = new BrowserWindow({
			icon: __dirname + '/assets/icon64.png',
			width: 1024,
			height: 768,
			minWidth: 340,
			minHeight: 180,
			setMenuBarVisibility: false,
			webPreferences: {
				preload: __dirname + '/preload.js',
			}
		});

		mainWindow.setMenuBarVisibility(false)
		mainWindow.loadURL('https://hipside.pl/');

		mainWindow.on('close', (evt) => {    											// When closing, hide it instead
			if ( remain ) {
				evt.preventDefault();
				mainWindow.hide();
			} else {
				mainWindow = null;
			}
		});

		mainWindow.webContents.on('new-window', (e, url) => {							// Open link outside electron, Requires target="_blank"
			  e.preventDefault();
			  electron.shell.openExternal(url);
		});

	};

	function createAppIcon()
	{
		appIcon = new Tray(__dirname + '/assets/icon128.png');
		var contextMenu = Menu.buildFromTemplate([
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
			{   label: 'Wyjdź',
				click: () => {
					remain = false;
					app.quit();
				}
			},
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
			player.metadata = {
				'mpris:trackid': player.objectPath('track/0'),
				'mpris:artUrl': track.cover,
				'xesam:title': track.title,
				'xesam:album': track.album,
				'xesam:artist': [track.artist],
			};

			if( status == true )
			{
				player.playbackStatus = 'Playing';
			}
			else
			{
				player.playbackStatus = 'Stopped';
			}
		}

		const client = require('discord-rich-presence')('533674939639791638');
		client.updatePresence({
			details: track.title,
			state: track.artist,
			largeImageKey: 'main',
			instance: true,
		});

	}
}