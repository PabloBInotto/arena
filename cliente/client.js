const io = require("socket.io-client");
const { exec } = require("child_process");
const dotenv = require("dotenv");
dotenv.config();

const pcId = process.argv[2] || "PC1"; // passe PC1 / PC2 na linha de comando
const SERVER_URL = process.env.SERVER_URL; // ajuste aqui

const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000
});

function register() {
  socket.emit("register_pc", pcId);
  sendStatus();
}

socket.on("connect", () => {
  console.log(`Conectado ao operador como ${pcId}`);
  register();
});

socket.on("reconnect", () => {
  console.log(`Reconectado ao operador como ${pcId}`);
  register();
});

socket.on("disconnect", () => {
  console.log("Desconectado do operador");
});

socket.on("command", ({ action, game }) => {
  console.log(`Comando recebido: ${action}`);

  if (action === "start_game") {
    startSession(game);
  } else if (action === "stop_game") {
    stopSession(game);
  } else if (action=== "ping") {
    sendStatus();
  }

});

function startSession(game) {
  console.log(`Iniciando ${game} VR...`);

  //TODO: adicionar verificação se já está rodando
  //TODO: adicionar query para coletar configs do jogo no DB

  const steamPath = `"C:\\Program Files (x86)\\Steam\\steam.exe"`;

  const cmd = `${steamPath} -applaunch ${game}`;

  exec(cmd, (err) => {
    if (err) {
      console.error("Erro ao iniciar jogo:", err);
      socket.emit("pc_status", {
        pcId,
        online: true,
        error: "Falha ao iniciar jogo"
      });
      return;
    }

    console.log("Propagation VR iniciado com sucesso.");
    sendStatus();
  });
}

async function stopGame(game) {
  console.log(`Encerrando ${game} VR...`);

  exec(`taskkill /IM ${game}.exe /F`, (err) => {
    if (err) {
      console.error("Erro ao fechar jogo:", err);
    } else {
      console.log(`${game} VR encerrado.`);
    }
  });
}

async function stopServer() {
  console.log("Encerrando Propagation VR...");

  exec('taskkill /IM vrserver.exe /F', (err) => {
    if (err) {
      console.error("Erro ao fechar jogo:", err);
    } else {
      console.log("Propagation VR encerrado.");
    }
  });
}

async function stopMonitorVR() {
  console.log("Encerrando Propagation VR...");

  exec('taskkill /IM vrmonitor.exe /F', (err) => {
    if (err) {
      console.error("Erro ao fechar jogo:", err);
    } else {
      console.log("Propagation VR encerrado.");
    }
  });
}

async function stopSession(game) {
  console.log("Encerrando sessão arena VR...");
  await stopGame(game);
  await stopServer();
  await stopMonitorVR();
  sendStatus();
}

function sendStatus() {
  const payload = {
    pcId,
    online: true,
    timestamp: new Date().toISOString()
    // futuramente: FPS, CPU, etc.
  };
  socket.emit("pc_status", payload);
}
