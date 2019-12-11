# syncActionEventAcrossBrowsingContext

This script is an example of Broadcast Channel API for syncing user actions accross tabs. 

It could be tested on dipe.io online game. Allowing to control multiple units together of different tabs. 'Tampermokey' browser extension could be used to load the script automatically.

API:  
  - Executes immediately on load, messaging a shared channel with a specific hard coded name.
  - Press `0` key to toggle broadcast of tab. 
  - Hold `shitft` key to temporarly stop broadcast events - (Implementation should be refined for performance).
  
Instructions for `diep.io`:
_You will need to install it through TemperMonkey browser plugin, and could also install freeVPN to allow more than 2 connections._
- Add new script to the plugin (copy the contents from the source code
- Open several windows of the browser on the target website with the same url (diep.io room url).
- Open browser console (F12) to verify that the events are being propagated when turned on.
- Turn on the event propagation using the bound keys ("0" on each browser) - Check comments for options.
- When you move the mouse in one browser or initiate keyboard events, it should be duplicated on the other browsers. You could try resizing the browsers so they have the same size and work as expected.

![](Screenshot%20-%206%20windows%20with%20different%20vpn%20for%20each%20couple.png?raw=true)
