// ==UserScript==
// @name        DiepIOSyncControl
// @description Diep.io
// @version     2.0.1
// @author      tampermonkey
// @include     http://diep.io/*
// @connect     diep.io
// @run-at      document-start
// @namespace tampermonkey
// ==/UserScript==

/**
 * This script is an example of Broadcast Channel API for syncing user actions accross tabs. 
 * It could be tested on dipe.io online game. Allowing to control multiple units together of different tabs. 'Tampermokey' browser extension could be used to load the script automatically.
 */

const screenConstant = getScreenConstant();

// diep.io specific values
function getScreenConstant({ width = window.innerWidth, height = window.innerHeight  } = {})
{
    if(width > height * 16 / 9)
    {
        return width;
    }
    return height * 16 / 9;
}

// diep.io canvas dimension logic as example for syncing movements accross tabs with different viewport width and height - copied from https://github.com/BE1A/48666/blob/master/DiepBox.user.js
function GetCoordClamp(mouseX, mouseY)
{
    let ret = {};
    let hsx = window.innerWidth / 2;
    let hsy = window.innerHeight / 2;
    let amx = mouseX - hsx;
    let amy = mouseY - hsy;

    let dc = 0.96;
    if((amx > -hsx * dc) && (amx < hsx * dc) && (amy > -hsy * dc) && (amy < hsy * dc))
    {
        ret[0] = mouseX;
        ret[1] = mouseY;
        return ret;
    }
    else
    {
        let fA = (amx * hsy) - (amy * hsx);
        let fB = (amx * hsy) + (amy * hsx);
        if(fA > 0)
        {
            if(fB > 0)
            {
                amy = amy * (hsx * dc / amx);
                amx = hsx * dc;
            }
            else
            {
                amx = amx * (-hsy * dc / amy);
                amy = -hsy * dc;
            }
        }
        else
        {
            if(fB > 0)
            {
                amx = amx * (hsy * dc / amy);
                amy = hsy * dc;
            }
            else
            {
                amy = amy * (-hsx * dc / amx);
                amx = -hsx * dc;
            }
        }
        ret[0] = amx + hsx;
        ret[1] = amy + hsy;
    }
    return ret;
}

// here are used specific calculations of viewport dimension differences between message sender and receiver tabs, taking into account specific diep.io canvas values.
function simulateMouseMove({ type, clientX, clientY, senderContextViewportWidth, senderContextViewportHeight }) {
    let eventTarget = (typeof canvas !== 'undefined') ? canvas : document;

    let cX = (clientX / senderContextViewportWidth) * window.innerWidth /* of receiver */;
    let cY = (clientY / senderContextViewportHeight) * window.innerHeight;
    let dX = clientX - (senderContextViewportWidth / 2)
    let dY = clientY - (senderContextViewportHeight / 2)

    let clamped = GetCoordClamp(dX + window.innerWidth / 2, dY + window.innerHeight / 2);
    eventTarget.dispatchEvent(new MouseEvent(type, { 'clientX': clamped[0], 'clientY': clamped[1] }));
}

function simulateKeyPress({ keyCode, type }) {
    let eventObj;
    eventObj = document.createEvent("Events"); 
    eventObj.initEvent(type, true, true); 
    eventObj.keyCode = keyCode; 
    window.dispatchEvent(eventObj);
}

function simulateMousePress({ button, clientX, clientY, type }) {
    let eventTarget = (typeof canvas !== 'undefined') ? canvas : document;
    eventTarget.dispatchEvent(new MouseEvent(type, { 'clientX': clientX, 'clientY': clientY, 'button': button, 'mozPressure' : 1.0 }));
}

function synchronizeControl() {
    
    let broadcastChannel = new BroadcastChannel('sharedChannel')
    let stopBroadcast = false; // stop propagation of control / user event to other tabs
    
    // Receive other browsing context action event
    broadcastChannel.onmessage = ({ data: actionEvent}) => {
        if(stopBroadcast) return; // don't react to incoming messages.
        // handle different types
        switch (actionEvent.type) {
            case 'mouseup':
            case 'mousedown':
                simulateMousePress({ button: actionEvent.button, clientX: actionEvent.clientX, clientY: actionEvent.clientY, type: actionEvent.type })
            break;  
            case 'keydown':
            case 'keyup':
                simulateKeyPress({ keyCode: actionEvent.keyCode, type: actionEvent.type })
            break;
            case 'mousemove':
                simulateMouseMove({ type: actionEvent.type, clientX: actionEvent.clientX, clientY: actionEvent.clientY, senderContextViewportWidth: actionEvent.viewportWidth, senderContextViewportHeight: actionEvent.viewportHeight })
            break;
            default:
                console.log(`Receieved unhandle event type ${actionEvent.type}`)
            break;
        }
    }
    
    /* 
    *   Add action event listener & broadcast event
    */
    let evenTypeArray = ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove'] // event to propagate to other contexts
    for(let eventType of evenTypeArray) {
        document.addEventListener(eventType, eventAction => {
            // check if event triggered by a user and not programmatically (prevent infinite loop)
            if(!eventAction.isTrusted) return;
    
            console.log(eventAction)
            // Check for shift key - holding shift key will prevent propagation
            if(eventAction.key == 'Shift') {
                switch (eventAction.type) {
                    case 'keydown':
                        stopBroadcast = true
                        console.log('%s %c%s', '🕹️ Propagation', 'color: Red; font-weight: bold;', 'stopped')
                    break;
                    case 'keyup':
                        stopBroadcast = false
                        console.log('%s %c%s', '🕹️ Propagation', 'color: Green; font-weight: bold;', 'active')
                    break;
                }
            } 
            if(stopBroadcast) return;

            // handle Enter key
            if(eventAction.key == 'Enter') stopBroadcast = !stopBroadcast // toggle

            // Extract properies
            eventActionObject = {
                // extract all relevant properties
                type: eventAction.type,
                clientX: eventAction.clientX,
                clientY: eventAction.clientY, 
                button: eventAction.button,
                keyCode: eventAction.keyCode,
                which: eventAction.which,
                shiftKey: eventAction.shiftKey,
            }
            if(eventAction.type == 'mousemove') { // calculate dimension only for mousemove to prevent unnecessary work.
                eventActionObject = Object.assign(eventActionObject, {
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight    
                })
            }
            // let eventActionObject = { ...eventAction } // Event properties are propagated to higher prtotype chain // shallow copy, to extract only non nested & non methods values.
            // let eventActionObject = JSON.parse(JSON.stringify(eventAction)) // because Event has functions, JSON.strigify cannot handle it properly. // Insures all methods/functions are removed, as postMessage accepts only objects.
    
            // Propagate current browsing context's action event
            broadcastChannel.postMessage(eventActionObject)
        })
    }

    console.group('%c%s',  'color: Green; font-weight: bold;', `🕹️ Synchronizing control to other tabs.`)
    console.log('%c%s',  'color: Grey;', `• Hold Shift key to temporarly stop propagation of user event.`)
    console.log('%c%s',  'color: Grey;', `• Click Enter key to toggle propagation of user event.`)
    console.groupEnd()
}    

synchronizeControl() // initialize on runtime