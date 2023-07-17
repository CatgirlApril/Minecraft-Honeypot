const host = '0.0.0.0'
const port = 25565
const version = '1.16.3'

const abuseipdb_key = process.env['ABUSEIPDB_API_KEY']
const report_ip = false

const discord_webhook = process.env['DISCORD_WEBHOOK_URL']
const send_to_webhook = false

module.exports = {
    host,
    port,
    version,
    abuseipdb_key,
    report_ip,
    discord_webhook,
    send_to_webhook
}
