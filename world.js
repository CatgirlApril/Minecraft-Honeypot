const config = require('./config.js')

const Block = require('prismarine-block')(require('prismarine-registry')(config.version))

function setup(chunk, mcData) {
    chunk.initialize((x, y, z) => {
        let block = mcData.blocksByName.air
        let metadata = 0

        if (y === 0) {
            block = mcData.blocksByName.bedrock
        }

        if (y > 0 && y < 3) {
            block = mcData.blocksByName.dirt
            metadata = 1
        }

        if (y === 3) {
            block = mcData.blocksByName.grass_block
        }

        return new Block(block.id, mcData.biomesByName.plains.id, metadata)
    })
}

module.exports = {
    setup,
}
