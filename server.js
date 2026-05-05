// Riz'Fighters relay server. Deploy to Render/Fly/Railway.
// Run: `node server.js` (port 3001 or process.env.PORT)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.get('/', (_req, res) => res.send('Riz Fighters server OK'));

const rooms = {};
const rand = (n) => Math.floor(Math.random() * n) + 1;

function cleanup(roomId) {
  const r = rooms[roomId];
  if (r && r.players.length === 0) delete rooms[roomId];
}

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, playerName }) => {
    if (!rooms[roomId]) rooms[roomId] = { players: [], names: [], chars: [null, null], roundWins: [0, 0], currentRound: 1, stage: rand(5) };
    const room = rooms[roomId];
    if (room.players.length >= 2) return socket.emit('room_full');
    const slot = room.players.length + 1;
    room.players.push(socket); room.names.push(playerName);
    socket.data = { roomId, slot };
    socket.join(roomId);
    socket.emit(slot === 1 ? 'room_created' : 'room_joined', { roomId, slot });
    if (slot === 2) {
      io.to(roomId).emit('player_joined', { p1Name: room.names[0], p2Name: room.names[1] });
      io.to(roomId).emit('match_ready', { p1Name: room.names[0], p2Name: room.names[1] });
    }
  });

  socket.on('cursor_move', (d) => socket.to(socket.data?.roomId).emit('opponent_cursor', d));
  socket.on('character_selected', ({ character }) => {
    const r = rooms[socket.data?.roomId]; if (!r) return;
    r.chars[socket.data.slot - 1] = character;
    socket.to(socket.data.roomId).emit('opponent_selected', { character });
    if (r.chars[0] && r.chars[1]) io.to(socket.data.roomId).emit('match_start', { stage: r.stage, round: r.currentRound, p1Char: r.chars[0], p2Char: r.chars[1] });
  });

  socket.on('player_state', (s) => socket.to(socket.data?.roomId).emit('opponent_state', s));
  socket.on('attack_hit', (h) => socket.to(socket.data?.roomId).emit('opponent_hit', h));

  socket.on('round_end', ({ winner, reason, p1hp, p2hp }) => {
    const r = rooms[socket.data?.roomId]; if (!r) return;
    if (socket.data.slot !== 1) return; // only p1 reports authoritative end
    if (winner === 1 || winner === 2) r.roundWins[winner - 1]++;
    io.to(socket.data.roomId).emit('round_result', { winner, reason, p1hp, p2hp, wins: r.roundWins });
    if (r.roundWins[0] >= 2 || r.roundWins[1] >= 2) {
      io.to(socket.data.roomId).emit('match_over', { winner: r.roundWins[0] >= 2 ? 1 : 2 });
    } else {
      r.currentRound++;
      setTimeout(() => io.to(socket.data.roomId).emit('next_round', { round: r.currentRound }), 3000);
    }
  });

  socket.on('rematch_request', () => {
    const r = rooms[socket.data?.roomId]; if (!r) return;
    r.roundWins = [0, 0]; r.currentRound = 1; r.stage = rand(5);
    io.to(socket.data.roomId).emit('rematch_ready', { stage: r.stage });
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data || {};
    if (!roomId || !rooms[roomId]) return;
    rooms[roomId].players = rooms[roomId].players.filter((s) => s !== socket);
    socket.to(roomId).emit('opponent_left');
    cleanup(roomId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Riz Fighters server on :' + PORT));