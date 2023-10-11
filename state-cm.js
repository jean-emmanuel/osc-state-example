/*

State saving / loading with Open Stage Control

*/

// states will be saved in this file
const statePath = './states_data.json'

// that our local reference to the state object
// initially loaded from the file if it exists
const states = loadJSON(statePath) || {}

// function for sending a state to all clients
// if provided slot name exists
function loadState(name) {
    if (name in states) {
        receive('/STATE/SET', states[name])
    } else {
        console.log(`state ${name} not found`)
    }
}

// function for saving local states reference to file
function saveFile() {
    saveJSON(statePath, states)
}

// function for storing a state in the local states reference
function saveState(name, state) {
    states[name] = state
    saveFile()
}

// function for sending the list of available slot names
// to all clients (updates the values in the slot selection switch)
function syncSlots(id) {
    var slots = Object.keys(states)
    receive('/slotnames', slots)
}

// when a client loads a session, send available slot names to all clients
app.on('sessionOpened', (data, client)=>{
    syncSlots()
})

// now that's our custom module
module.exports = {

    // filter messages sent by widgets
    oscOutFilter: function(data) {
        var {host, port, address, args} = data

        // state save button
        // 1st arguments: slot name
        // 2nd arguments: stringified state object
        if (address === '/state/save' && args.length === 2) {
            try {
                saveState(args[0].value, JSON.parse(args[1].value))
            } catch (e) {
                console.log(`error while saving state ${args[0].value}`)
                console.error(e)
            }
            // empty return to bypass the original message
            // it would error otherwise because it's targetted at
            // an invalid ip:port anyway : "custom:module" is just
            // a convenient way to make the widget send something (one requires at least one target)
            // while making it clear it's only for the custom module
            return
        }

        // state load button
        // 1st arguments: slot name
        else if (address === '/state/load') {
            loadState(args[0].value)
            // empty return to bypass the original message
            return
        }

        // state add button
        // 1st arguments: slot name
        else if (address === '/state/new') {
            if (states[args[0].value]) {
                receive('/NOTIFY', 'state name already exists !')
            } else {
                states[args[0].value] = {}
            }
            syncSlots()
            saveFile()
            // empty return to bypass the original message
            return
        }

        // state remove button
        // 1st arguments: slot name
        else if (address === '/state/delete') {
            if (!states[args[0].value]) {
                receive('/NOTIFY', 'state name desn\'t exists !')
            } else {
                delete states[args[0].value]
            }
            syncSlots()
            saveFile()
            // empty return to bypass the original message
            return
        }

        // let all other messages through
        // otherwise regular widgets won't be able to send anything
        return data
    }
}
