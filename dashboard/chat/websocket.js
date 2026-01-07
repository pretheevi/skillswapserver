const url = require("url");
const { WebSocket } = require("ws");
const JWT = require("../../middleware/jwt");

const clients = new Object();
function wsConnectionHandler(ws, req) {
  console.log("ws connection! total client:");
  const request = url.parse(req.url, true);
  
  const token = request.query.token;
  if (!token) {
    ws.close();
    return;
  }

  let user;
  try {
    user = JWT.verify(token);
    console.log("ws user:", user._id);
  } catch {
    ws.close();
    return;
  }

  const userId = user._id
  console.log(userId)
  if (clients[userId]) {
    clients[userId].add(ws);
  } else {
    clients[userId] = new Set();
    clients[userId].add(ws);
  }

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    const { to, text } = msg;
    if (!clients[to]) return;

    console.log(to, text);
    for (const toWs of clients[to] || []) {
      if (toWs?.readyState === WebSocket.OPEN) {
        toWs.send(JSON.stringify({ from: userId, text }));
      }
    }
  });

  ws.on("close", () => {
    clients[userId]?.delete(ws);
    if (clients[userId]?.size === 0) {
      delete clients[userId];
    }
  });
}

module.exports = wsConnectionHandler;
