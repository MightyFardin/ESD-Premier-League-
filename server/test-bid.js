const io = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server");
  
  // Need to know current state to place a valid bid
  socket.on("stateUpdate", (state) => {
     console.log("Got state update");
     if (state.managers.length > 0) {
        const manager = state.managers[0];
        console.log("Trying to bid as manager:", manager.id);
        
        socket.emit("placeBid", { amount: 150, managerId: manager.id });
     } else {
        console.log("No managers found");
     }
  });
});
