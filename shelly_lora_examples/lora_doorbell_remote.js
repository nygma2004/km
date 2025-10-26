//AES key is only for example, generate unique key!!
const aesKey = '2664ed9a5fac9b03164bc2d57b339644d08e360e99a28fc05b307d6e15d085a5';
const CHECKSUM_SIZE = 4;

function generateChecksum(msg) {
  let checksum = 0;
  for (let i = 0; i < msg.length; i++) {
    checksum ^= msg.charCodeAt(i);
  }
  let hexChecksum = checksum.toString(16);

  while (hexChecksum.length < CHECKSUM_SIZE) {
    hexChecksum = '0' + hexChecksum;
  }

  return hexChecksum.slice(-CHECKSUM_SIZE);
}

// Lora functions for receiving messages

function verifyMessage(message) {
  if (message.length < CHECKSUM_SIZE + 1) {
    console.log('[LoRa] invalid message (too short)');
    return;
  }

  const receivedCheckSum = message.slice(0, CHECKSUM_SIZE);
  const _message = message.slice(CHECKSUM_SIZE);
  const expectedChecksum = generateChecksum(_message);

  if (receivedCheckSum !== expectedChecksum) {
    console.log('[LoRa] invalid message (checksum corrupted)');
    return;
  }

  return _message;
}

function decryptMessage(buffer, keyHex) {
  function fromHex(hex) {
    const arr = new ArrayBuffer(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  function hex2a(hex) {
    hex = hex.toString();
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  function toHex(buffer) {
    let s = '';
    for (let i = 0; i < buffer.length; i++) {
      s += (256 + buffer[i]).toString(16).substr(-2);
    }
    return s;
  }

  const key = fromHex(keyHex);
  const decrypted = AES.decrypt(buffer, key, { mode: 'ECB' });

  if (!decrypted || decrypted.byteLength === 0) {
    console.log('[LoRa] invalid msg (empty decryption result)');
    return;
  }

  const hex = toHex(decrypted);
  const checksumMessage = hex2a(hex).trim();
  const finalMessage = verifyMessage(checksumMessage);
  
  return finalMessage;
}

// Lora functions for sending messages

function encryptMessage(msg, keyHex) {
  function fromHex(hex) {
    const arr = new ArrayBuffer(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  function padRight(msg, blockSize) {
    const paddingSize = (blockSize - msg.length % blockSize) % blockSize;;

    for (let i = 0; i < paddingSize; i++) {
      msg += ' ';
    }

    return msg;
  }

  msg = msg.trim();
  const formattedMsg = padRight(msg, 16);
  const key = fromHex(keyHex);
  const encMsg = AES.encrypt(formattedMsg, key, { mode: 'ECB' });
  return encMsg;
}

function sendMessage(message) {
  const checkSumMessage = generateChecksum(message) + message;
  const encryptedMessage = encryptMessage(checkSumMessage, aesKey);

  Shelly.call(
    'Lora.SendBytes',
    { id: 100, data: btoa(encryptedMessage) },
    function (_, err_code, err_msg) {
      if (err_code !== 0) {
        console.log('Error:', err_code, err_msg);
      }
    }
  );
}

// ************************************
// * Event handlers
// ************************************

Shelly.addEventHandler(function (event) {
  // for debugging
  // console.log("Event: ",event);
  
  // handle lora events
  if (typeof event === 'object' &&
      event.name === 'lora' &&
      event.info &&
      event.info.data) {

    const encryptedMsg = atob(event.info.data);
    const decryptedMessage = decryptMessage(encryptedMsg, aesKey);
  
    //do nothing, message is not encrypted or AES key mismatch
    if (typeof decryptedMessage === "undefined") {
      return;
    } else {
      console.log("Message received: ", decryptedMessage);
      console.log("RSSI: ",event.info.rssi," ,SNR: ",event.info.snr);
      
      // virtual button message, open the gate
      if (decryptedMessage==="AO") {
        Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
      }
      
      // virtual switch message, turn on/off garden light
      if (decryptedMessage.substring(0, 1) === "B") {
        if (decryptedMessage.substring(1, 2) === "O") {
          // turn on the light
          Shelly.call("Switch.Set","{ id:1, on:true }",null,null);
        }
        if (decryptedMessage.substring(1, 2) === "F") {
          // turn off the light
          Shelly.call("Switch.Set","{ id:1, on:false }",null,null);
        }
      }
    }
  }
  
  // handle button press events
  if (typeof event === 'object' &&
      event.info &&
      event.info.component === 'input:1' &&
      event.info.event === 'single_push') {
     
     console.log("Sending doorbell message");
     sendMessage("C");
   }

});