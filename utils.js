function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function getRandomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function broadcast(message, exclude, username, server) {
    let client
    const translate = 'chat.type.text'
    username = username || 'Server'

    for (const clientId in server.clients) {
        if (server.clients[clientId] === undefined) {
            continue
        }

        client = server.clients[clientId]

        if (client !== exclude) {
            const msg = {
                translate,
                with: [
                    username,
                    message
                ]
            }

            client.write('chat', {
                message: JSON.stringify(msg),
                position: 0,
                sender: '0'
            })
        }
    }
}

module.exports = {
    getRandomInt,
    getRandomIntBetween,
    broadcast
}
