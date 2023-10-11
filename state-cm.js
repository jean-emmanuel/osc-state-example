const statePath = './states_data.json'
const states = loadJSON(statePath) || {}

function loadState(name) {
    if (name in states) {
        receive('/STATE/SET', states[name])
    } else {
        console.log(`state ${name} not found`)
    }
}

function saveFile() {
    saveJSON(statePath, states)
}

function saveState(name, state) {
    states[name] = state
    saveFile()
}

function syncSlots(id) {
    var slots = Object.keys(states)
    receive('/slotnames', slots)
}

app.on('sessionOpened', (data, client)=>{
    console.log(states)
    syncSlots()
})

module.exports = {
    oscOutFilter: function(data) {
        var {host, port, address, args} = data

        if (address === '/state/save' && args.length === 2) {
            try {
                saveState(args[0].value, JSON.parse(args[1].value))
            } catch (e) {
                console.log(`error while saving state ${args[0].value}`)
                console.error(e)
            }
            return
        }

        else if (address === '/state/load') {
            loadState(args[0].value)
            return
        }

        else if (address === '/state/new') {
            if (states[args[0].value]) {
                receive('/NOTIFY', 'state name already exists !')
            } else {
                states[args[0].value] = {}
            }
            syncSlots()
            saveFile()
            return
        }

        else if (address === '/state/delete') {
            if (!states[args[0].value]) {
                receive('/NOTIFY', 'state name desn\'t exists !')
            } else {
                delete states[args[0].value]
            }
            syncSlots()
            saveFile()
            return
        }



        return data
    }
}
