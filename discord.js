const config = require('./config.js')

const axios = require('axios')

async function sendEmbedToWebhook(client) {
    let embed

    if (client.username == null) {
        embed = {
            title: 'Minecraft Honeypot',
            description: 'The server has been pinged',
            color: 0xFF0000,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'IP',
                    value: client.socket.remoteAddress,
                    inline: true,
                },
            ],
        }
    } else {
        embed = {
            title: 'Minecraft Honeypot',
            description: 'A player connected to the server',
            color: 0xFF0000,
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Username',
                    value: client.username,
                    inline: true,
                },
                {
                    name: 'IP',
                    value: client.socket.remoteAddress,
                    inline: true,
                },
            ],
        }
    }

    try {
        const response = await axios.post(config.discord_webhook, {
            embeds: [embed],
        })

        if (response.status !== 204)
            console.log('Failed to send embed message to webhook.')

    } catch (error) {
        console.error('Error sending embed message: ', error.message)
    }
}

module.exports = {
    sendEmbedToWebhook
}
