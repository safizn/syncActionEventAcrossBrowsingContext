# syncActionEventAcrossBrowsingContext

This script is an example of Broadcast Channel API for syncing user actions accross tabs. 

It could be tested on dipe.io online game. Allowing to control multiple units together of different tabs. 'Tampermokey' browser extension could be used to load the script automatically.

API:  
  • Executes immediately on load, messaging a shared channel with a specific hard coded name.
  • Press `0` key to toggle broadcast of tab. 
  • Hold `shitft` key to temporarly stop broadcast events - (Implementation should be refined for performance).
