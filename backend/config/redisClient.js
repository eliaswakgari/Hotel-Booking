const redis = require("redis");

let client;

// Only connect if REDIS_URL is provided
if (process.env.REDIS_URL) {
  client = redis.createClient({
    url: process.env.REDIS_URL,
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
} else {
  console.log("Redis URL not provided. Skipping Redis connection.");
  client = null; // Optional: your code can check if client exists before using it
}

module.exports = client;
