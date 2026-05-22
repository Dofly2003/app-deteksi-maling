const functions = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

exports.helloWorld = functions.https.onRequest((req, res) => {
  logger.info("Hello logs!");
  res.send("Hello from Firebase!");
});