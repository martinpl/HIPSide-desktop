document.addEventListener('DOMContentLoaded', function()
{
	const ipcRenderer = require('electron').ipcRenderer;

	player.$watch('track', function()
	{
		ipcRenderer.send('updateMeta', player.track);

		if(typeof notification !== 'undefined') {
			notification.close();
		}

		notification = new Notification( player.track.album || player.track.title , {
			icon: player.track.cover,
			body: player.track.artist + ' - ' + player.track.title,
		});

	});

	player.$watch('isPlaying', function()
	{
		ipcRenderer.send('updateStatus', player.isPlaying);
	});
});