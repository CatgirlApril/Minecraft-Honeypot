const config = require('./config.js')
const discord = require('./discord.js')
const utils = require('./utils.js')

const axios = require('axios')
const moment = require('moment')

const reportedIPs = new Map(); // Map<ip, timestamp> - Used to prevent an IP from being reported more than once per 24 hours
const tempMap = new Map()

function analyse(client) {
    if (client.username == null) {
        console.log('Pinged from ' + client.socket.remoteAddress)
    } else {
        console.log(client.username + ' connected from ' + client.socket.remoteAddress)
    }

    if (config.send_to_webhook) {
        discord.sendEmbedToWebhook(client)
    }

    if (config.report_ip) {
        const lastReportedAt = reportedIPs.get(client.socket.remoteAddress)

        if (lastReportedAt && moment().diff(lastReportedAt, 'hours') < 24) {
            console.log('IP ' + client.socket.remoteAddress + ' has been reported within the last 24 hours; not reporting')
        } else if (!tempMap.has(client.socket.remoteAddress)) {
            tempMap.set(client.socket.remoteAddress, new Date().getTime())
        }
    }
}

function checkIPs() {
    const currentTime = new Date().getTime()

    for (const [ip, timestamp] of tempMap.entries()) {
        const threshold = utils.getRandomIntBetween(900000, 3600000) // Random time between 15 and 60 minutes in milliseconds

        if (currentTime - timestamp >= threshold) {
            console.log(`IP ${ip} exceeded its threshold, reporting.`)
            reportIP(ip)
            tempMap.delete(ip)
        }
    }
}

async function reportIP(ip) {
    try {
        const response = await axios.post('https://api.abuseipdb.com/api/v2/report', {
            ip: ip,
            categories: [14, 15], // 14 = portscan, 15 = hacking
            comment: 'Scanning for Minecraft servers (port ' + config.port + ')',
        }, {
            headers: {
                'Key': config.abuseipdb_key,
                'Accept': 'application/json',
            },
        })

        if (response.status === 200) {
            reportedIPs.set(ip, moment())
            console.log('IP reported successfully:', ip)
        } else {
            console.log('Failed to report IP:', ip)
        }
    } catch (error) {
        console.error('Error reporting IP: ', error.message)
    }
}

module.exports = {
    analyse,
    checkIPs
}
