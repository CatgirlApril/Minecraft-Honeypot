function setup(chunk, mcData, Block, isSpecial) {
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
            if (isSpecial) {
                block = mcData.blocksByName.gold_block
            }
        }

        return new Block(block.id, mcData.biomesByName.plains.id, metadata)
    })
}

module.exports = {
    setup
}
