document.addEventListener('DOMContentLoaded', function()
{
	const ipcRenderer = require('electron').ipcRenderer;

	player.$watch('track', function()
	{
		ipcRenderer.send('updateMeta', player.track);
	});

	player.$watch('isPlaying', function()
	{
		ipcRenderer.send('updateStatus', player.isPlaying);
	});
});