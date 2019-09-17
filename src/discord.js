const electron = require('electron');
const app = electron.app;
const session = electron.session;
const ipcMain = electron.ipcMain;

const discordRichPresenceClient = require('discord-rich-presence')('533674939639791638');
var discordRichPresence = true;

var status; // do usuniecia


app.on('ready', () =>
{
    setDiscordStatus();

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

module.exports = {
    toggleDiscordStatus: function()
    {
        discordRichPresence = !discordRichPresence;

        var expiration = new Date();
        var hour = expiration.getHours();
        hour = hour + 6;
        expiration.setHours(hour);

        session.defaultSession.cookies.set({ 
            url: baseURL, 
            name: 'discordRichPresence', 
            value: discordRichPresence.toString(), 
            expirationDate: expiration.getTime() 
        })

        if(discordRichPresence == false && typeof discordRichPresenceClient !== 'undefined')
        {
            discordRichPresenceClient.updatePresence();
        }
    }

};

function update()
{
    if(discordRichPresence == true) 
    {
        var presence = {
            details: '🎧 ' + track.title,
            state: '🎙️ ' + track.artist,
            largeImageKey: 'main',
            instance: true,
        }

        if( status == false )
        {
            presence.details = '⏸️ ' + track.title;
        }

        discordRichPresenceClient.updatePresence(presence);
    }
}

function setDiscordStatus()
{
	session.defaultSession.cookies.get({ url: baseURL, name: 'discordRichPresence' })
	.then((cookies) => {
		if(cookies[0].value == "false") { 
            discordRichPresence = false;
            contextMenu.items[4].checked = discordRichPresence;
			appIcon.setContextMenu(contextMenu);
		}
	})
}