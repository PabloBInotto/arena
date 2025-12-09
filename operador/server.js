const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Serve arquivos estáticos do painel (HTML/JS/CSS)
app.use(express.static("public"));

// Mapeia PCs conectados: { pcId: socket }
const pcs = {};

io.on("connection", (socket) => {
  console.log("Nova conexão socket:", socket.id);

  socket.on("register_pc", (pcId) => {
    pcs[pcId] = socket;
    console.log(`PC registrado: ${pcId}`);
    io.emit("pc_list", Object.keys(pcs)); // atualiza lista no painel
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado:", socket.id);
    // remove da lista de pcs se for um cliente registrado
    for (const [pcId, sock] of Object.entries(pcs)) {
      if (sock.id === socket.id) {
        delete pcs[pcId];
        console.log(`PC removido: ${pcId}`);
      }
    }
    io.emit("pc_list", Object.keys(pcs));
  });

  // Resposta de status dos PCs
  socket.on("pc_status", (payload) => {
    io.emit("pc_status_update", payload);
  });
});

// Endpoint para o painel enviar comandos
io.of("/").on("connection", (socket) => {
  socket.on("send_command", ({ pcId, action }) => {
    const target = pcs[pcId];
    if (!target) {
      console.log(`PC ${pcId} não encontrado`);
      socket.emit("command_result", {
        pcId,
        action,
        ok: false,
        message: "PC não conectado"
      });
      return;
    }

    console.log(`Enviando comando ${action} para ${pcId}`);
    target.emit("command", { action });

    socket.emit("command_result", {
      pcId,
      action,
      ok: true,
      message: "Comando enviado"
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Operador rodando em http://localhost:${PORT}`);
});
