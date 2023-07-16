const Vec3 = require("vec3");

function setup(chunk, mcData) {
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      chunk.biomes[x + z * 16] = 1;

      chunk.setBlockType(new Vec3(x, 3, z), mcData.blocksByName.grass_block.id);
      chunk.setBlockData(new Vec3(x, 3, z), 1);

      for (let y = 1; y < 3; y++) {
        chunk.setBlockType(new Vec3(x, y, z), mcData.blocksByName.dirt.id);
        chunk.setBlockData(new Vec3(x, y, z), 0);
      }

      chunk.setBlockType(new Vec3(x, 0, z), mcData.blocksByName.bedrock.id);
      chunk.setBlockData(new Vec3(x, 0, z), 0);

      for (y = 0; y < 256; y++) {
        chunk.setSkyLight(new Vec3(x, y, z), 15);
        chunk.setBlockLight(new Vec3(x, y, z), 15);
      }
    }
  }
}

module.exports = {
  setup,
};
