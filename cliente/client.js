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

socket.on("command", ({ action }) => {
  console.log(`Comando recebido: ${action}`);

  if (action === "start_game") {
    startGame();
  } else if (action === "stop_game") {
    stopGame();
  } else if (action === "ping") {
    sendStatus();
  }
});

function startGame() {
  console.log("Simulando abertura do Propagation VR...");

  // TODO: aqui você coloca o comando real.
  // Exemplo (Windows, abrindo Steam com appid - AJUSTAR O CAMINHO E APPID):
  //
  // const cmd = `"C:\\Program Files (x86)\\Steam\\steam.exe" -applaunch APPID_DO_PROPAGATION`;
  // exec(cmd, (err) => {
  //   if (err) {
  //     console.error("Erro ao abrir jogo:", err);
  //   } else {
  //     console.log("Jogo iniciado.");
  //   }
  // });

  sendStatus();
}

function stopGame() {
  console.log("Simulando fechamento do Propagation VR...");

  // TODO: aqui você coloca o comando real.
  // Exemplo no Windows, se souber o nome do executável:
  //
  // exec('taskkill /IM PropagationVR.exe /F', (err) => {
  //   if (err) {
  //     console.error("Erro ao fechar jogo:", err);
  //   } else {
  //     console.log("Jogo fechado.");
  //   }
  // });

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
