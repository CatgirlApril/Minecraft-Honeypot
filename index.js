const utils = require("./utils.js");
const world = require("./world.js");
const config = require("./config.js");

const mc = require("minecraft-protocol");
const Chunk = require("prismarine-chunk")(config.version);

const { analyse, checkIPs } = require("./analyse.js");

console.log("Starting honeypot...");

const server = mc.createServer({
  "online-mode": true,
  encryption: true,
  enforceSecureProfile: false,
  host: config.host,
  port: config.port,
  version: config.version,
  beforePing: async (response, client, callback) => {
    analyse(client);
    callback(null, response);
  },
});
const mcData = require("minecraft-data")(server.version);

const chunk = new Chunk();

world.setup(chunk, mcData);

console.log("Honeypot started");

setInterval(checkIPs, 60000);

server.on("login", function (client) {
  const loginPacket = mcData.loginPacket;

  analyse(client);

  // let player_brand; // Not used yet

  // client.on("minecraft:brand", (brand) => {
  //   player_brand = brand;
  // });

  client.write("login", {
    entityId: client.id,
    isHardcore: false,
    gameMode: 0,
    previousGameMode: 1,
    worldNames: loginPacket.worldNames,
    dimensionCodec: loginPacket.dimensionCodec,
    worldType: loginPacket.worldType,
    worldName: "minecraft:overworld",
    hashedSeed: [0, 0],
    maxPlayers: 20,
    viewDistance: 3,
    simulationDistance: 3,
    reducedDebugInfo: false,
    enableRespawnScreen: true,
    isDebug: false,
    isFlat: false
  });

  for (let x = -5; x < 5; x++) {
    for (let z = -5; z < 5; z++) {
      client.write("map_chunk", {
        x: x,
        z: z,
        heightmaps: {
          type: "compound",
          name: "",
          value: {}, // Client will accept fake heightmap
        },
        chunkData: chunk.dump(),
      });
    }
  }

  client.write("position", {
    x: 0,
    y: 64,
    z: 0,
    yaw: 0,
    pitch: 0,
    flags: 0x00
  });

  client.registerChannel("minecraft:brand", ["string", []]);
  client.writeChannel("minecraft:brand", "vanilla");

  // client.on("chat", function (data) {
  //   utils.broadcast(data.message, null, client.username, server);
  //   console.log(client.username + ": " + data.message);
  // });
});

server.on("error", function (error) {
  console.log("Error:", error);
});

server.on("connection", function (client) {
  console.log("New connection from IP:", client.socket.remoteAddress);
});

server.on("listening", function () {
  console.log("Listening on port", server.socketServer.address().port);
});

process.on("SIGINT", () => {
  server.close();
  console.log("Honeypot stopped.");
  process.exit();
});
