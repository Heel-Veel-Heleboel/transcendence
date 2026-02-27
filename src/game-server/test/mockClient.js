import { Client } from '@colyseus/sdk';

const createScene = function () {
  // (...)

  //
  // Create the Colyseus Client.
  //
  const colyseusSDK = new Client('ws://localhost:2567');

  //
  // Connect with Colyseus server
  //
  colyseusSDK
    .joinOrCreate('my_room')
    .then(function (room) {
      console.log('Connected to roomId: ' + room.roomId);
    })
    .catch(function (error) {
      console.log("Couldn't connect.");
    });

  // (...)
};

createScene();
