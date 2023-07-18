const { analyse, checkIPs } = require('./analyse.js')
const config = require('./config.js')
const utils = require('./utils.js')
const world = require('./world.js')

const Block = require('prismarine-block')(require('prismarine-registry')(config.version))
const Vec3 = require('vec3')

const mc = require('minecraft-protocol')
const mcData = require('minecraft-data')(config.version)

console.log('Starting honeypot...')

const server = mc.createServer({
    'online-mode': false,
    encryption: false,
    host: config.host,
    port: config.port,
    version: config.version,
    beforePing: async (response, client, callback) => {
        analyse(client)
        callback(null, response)
    },
})

console.log('[!] Generating world')

let Chunk = require('prismarine-chunk')(config.version)

let chunk = new Chunk()
world.setup(chunk, mcData, Block)

let chunks = new Array(10).fill(null)
for (var i = 0; i < chunks.length; i++) {
    chunks[i] = new Array(10).fill(null)
}

for (var chunkx = 0; chunkx < chunks.length; chunkx++) {
    for (var chunkz = 0; chunkz < chunks[chunkx].length; chunkz++) {
        chunks[chunkx][chunkz] = new Chunk()
        var isSpecial = chunkx === 4 && chunkz === 4 // this sets the topmost block of the chunk to gold blocks.
                                                     // it's just for testing; remove it later!
        world.setup(chunks[chunkx][chunkz], mcData, Block, isSpecial)
    }
}

console.log('[!] Done generating world')

console.log('[!] Honeypot started!')

setInterval(checkIPs, 60000)

let x = 0
let y = 4
let z = 0
let yaw = 0
let pitch = 0
let flags = 0x00

function updatePos(client) {
    if (!posUpdateReceived) {
        client.write('position', {
            x: x,
            y: y,
            z: z,
            yaw: yaw,
            pitch: pitch,
            flags: flags
        })
    }
}

let idPosLoop
let posUpdateReceived = false
async function startPosLoop(client) {
    await new Promise(r => setTimeout(r, 400));
    console.log('[!] Starting position loop')
    idPosLoop = setInterval(updatePos, 200, client)
}

server.on('login', function (client) {
    const loginPacket = mcData.loginPacket

    console.log('[!] Analysing client')

    analyse(client)

    // let player_brand; // NYI

    // client.on('minecraft:brand', (brand) => {
    //     player_brand = brand
    // })

    console.log('[!] Sending login packet')

    client.write('login', {
        entityId: client.id,
        isHardcore: false,
        gameMode: 0,
        previousGameMode: 1,
        worldNames: loginPacket.worldNames,
        dimensionCodec: loginPacket.dimensionCodec,
        dimension: loginPacket.dimension,
        worldName: 'minecraft:overworld',
        hashedSeed: [0, 0],
        maxPlayers: server.maxPlayers,
        viewDistance: 3,
        reducedDebugInfo: false,
        enableRespawnScreen: true,
        isDebug: false,
        isFlat: true
    })

    console.log('[!] Sending chunk packets')

    for (var chunkx = 0; chunkx < chunks.length; chunkx++) {
        for (var chunkz = 0; chunkz < chunks[chunkx].length; chunkz++) {
            client.write('map_chunk', {
                x: chunkx - 4,
                z: chunkz - 4,
                groundUp: true,
                biomes: Array(4 * 4 * 64).fill(mcData.biomesByName.plains.id),
                heightmaps: {
                  type: 'compound',
                  name: '',
                  value: {} // Client will accept fake heightmap
                },
                bitMap: chunks[chunkx][chunkz].getMask(),
                chunkData: chunks[chunkx][chunkz].dump(),
                blockEntities: []
            })
        }
    }

    console.log('[!] Sending initial position packet')
    updatePos(client)

    startPosLoop(client)

    console.log('[!] Sending server brand')

    client.registerChannel('minecraft:brand', ['string', []])
    client.writeChannel('minecraft:brand', 'vanilla')

    client.on('chat', function (data) {
        console.log(client.username + ': ' + data.message)
        utils.broadcast(data.message, null, client.username, server)
    })

    client.on('end', function (reason) {
        console.log('[E] Client disconnected: ' + reason)
        clearInterval(idPosLoop)
    })

    client.on('packet', async (data, meta, buf) => {
        if (meta.name === 'block_dig') {
            console.log('Block dig')

            var json = JSON.parse(JSON.stringify(data))

            var posx = json.location.x % 16
            var posy = json.location.y
            var posz = json.location.z % 16

            console.log('Block pos: ' + posx + ' ' + posy + ' ' + posz)

            var chunkx = Math.floor(posx / 16)
            var chunkz = Math.floor(posz / 16)

            console.log('Chunk pos: ' + (chunkx) + ' ' + (chunkz))

            var targetPos = new Vec3(posx, posy, posz)
            var targetChunk = chunks.at(chunkx + 4).at(chunkz + 4)

            targetChunk.setBlock(targetPos, new Block(mcData.blocksByName.air.id, mcData.biomesByName.plains.id, 0))
            console.log('New block: ' + targetChunk.getBlock(targetPos).getProperties())
        }
    })

    client.on('packet', async (data, meta, buf) => {
        if (meta.name === 'block_place') {
            console.log('Block place')

            var json = JSON.parse(JSON.stringify(data))

            var posx = json.location.x % 16
            var posy = json.location.y
            var posz = json.location.z % 16

            console.log('Block pos: ' + posx + ' ' + posy + ' ' + posz)

            var chunkx = Math.floor(posx / 16)
            var chunkz = Math.floor(posz / 16)

            console.log('Chunk pos: ' + (chunkx) + ' ' + (chunkz))

            var targetPos = new Vec3(posx, posy, posz)
            var targetChunk = chunks.at(chunkx + 4).at(chunkz + 4)

            targetChunk.setBlock(targetPos, mcData.blocksByName.diamond_block.id, mcData.biomesByName.plains.id, 0)
            targetChunk.getBlock(targetPos)

            client.write('map_chunk', {
                x: chunkx,
                z: chunkz,
                groundUp: true,
                biomes: Array(4 * 4 * 64).fill(mcData.biomesByName.plains.id),
                heightmaps: {
                  type: 'compound',
                  name: '',
                  value: {} // Client will accept fake heightmap
                },
                bitMap: targetChunk.getMask(),
                chunkData: targetChunk.dump(),
                blockEntities: []
            })
            console.log('New block: ' + targetChunk.getBlock(targetPos).getProperties())
        }
    })

    client.on('packet', async (data, meta, buf) => {
        if (meta.name === 'position') {
            posUpdateReceived = true
            json = JSON.parse(JSON.stringify(data))
            x = json.x
            y = json.y
            z = json.z
            posUpdateReceived = false
        }
    })

    client.on('packet', async (data, meta, buf) => {
        if (meta.name === 'position_look') {
            posUpdateReceived = true
            json = JSON.parse(JSON.stringify(data))
            x = json.x
            y = json.y
            z = json.z
            yaw = json.yaw
            pitch = json.pitch
            flags = json.flags
            posUpdateReceived = false
        }
    })

    client.on('packet', async (data, meta, buf) => {
        if (meta.name === 'look') {
            posUpdateReceived = true
            json = JSON.parse(JSON.stringify(data))
            yaw = json.yaw
            pitch = json.pitch
            posUpdateReceived = false
        }
    })
})

server.on('error', function (error) {
    console.log('[E] Error: ', error)
})

server.on('connection', function (client) {
    console.log('[!] New connection from IP: ', client.socket.remoteAddress)
})

server.on('listening', function () {
    console.log('[!] Listening on port ', server.socketServer.address().port)
})

process.on('SIGINT', () => {
    server.close()
    console.log('\n[E] Honeypot stopped.')
    process.exit()
})
