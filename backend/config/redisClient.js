const redis = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

(async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("Connected to Redis");
    }
  } catch (err) {
    console.error("Failed to connect to Redis:", err.message);
  }
})();

module.exports = client;
