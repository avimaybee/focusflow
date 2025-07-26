
const { onRequest } = require("firebase-functions/v2/https");
const { default: next } = require("next");

const nextjsServer = next({
  dev: false,
  conf: {
    distDir: ".next",
  },
});
const nextjsHandle = nextjsServer.getRequestHandler();

exports.nextApp = onRequest((req, res) => {
  return nextjsServer.prepare().then(() => nextjsHandle(req, res));
});
