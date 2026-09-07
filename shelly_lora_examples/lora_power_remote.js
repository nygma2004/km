//AES key is only for example, generate unique key!!
const aesKey = '2664ed9a5fac9b03164bc2d57b339644d08e360e99a28fc05b307d6e15d085a5';
const CHECKSUM_SIZE = 4;

let lastMsg = "";

// Power draw in watts
let power0 = 0;
let power1 = 0;
// Power consumption in the last minute in Milliwatt-hours
let lastmin0 = 0;
let lastmin1 = 0;
// Total power consumption in Watt-houts
let total0 = 0;
let total1 = 0;
// If the device on switch0 and switch1 is on
let status0 = false;
let status1 = false;


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
      
    }
  }
  
  // Read power consumption data
  if (typeof event === 'object' &&
      event.info &&
      event.info.component === 'switch:0' &&
      event.info.event === 'power_measurement') {
     
     power0 = event.info.apower;
     // console.log("Switch 0 power: ", power0 ," W");
     if (power0 < 1 && status0) { // turn off threshold
       status0 = false;
       console.log("Device on Switch 0 is OFF");
       sendMessage("GF");
       // turn off the output
       // Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
     } 
     if (power0 > 10 && !status0) { // turn on threshold
       status0 = true;
       console.log("Device on Switch 0 is ON");
       sendMessage("GO");
     } 
  }
  if (typeof event === 'object' &&
      event.info &&
      event.info.component === 'switch:1' &&
      event.info.event === 'power_measurement') {
     
     power1 = event.info.apower;
     // console.log("Switch 1 power: ", power1 ," W");
     if (power1 < 1 && status1) {
       status1 = false;
       console.log("Device on Switch 1 is OFF");
       sendMessage("HF");
     } 
     if (power1 > 10 && !status1) {
       status1 = true;
       console.log("Device on Switch 1 is ON");
       sendMessage("HO");
     } 
  }

});

Shelly.addStatusHandler(function (status) {
  // for debugging
  // console.log("Status: ",JSON.stringify(status));
  
  // Read power consumption data
  if (typeof status === 'object' &&
      status.delta &&
      status.delta.aenergy &&
      status.component === 'switch:0') {
     
     lastmin0 = status.delta.aenergy.by_minute[0];
     total0 = status.delta.aenergy.total;
     // console.log("Switch 0 last minute power: ", lastmin0 ," mWh, total: ", total0 ," Wh");
  }
  
  if (typeof status === 'object' &&
      status.delta &&
      status.delta.aenergy &&
      status.component === 'switch:1') {
     
     lastmin1 = status.delta.aenergy.by_minute[0];
     total1 = status.delta.aenergy.total;
     // console.log("Switch 1 last minute power: ", lastmin1 ," mWh, total: ", total1 ," Wh");
  }

});

// Create a timer event to send power consumption data periodically to gateway
function LoraUpdate(userdata) {
  
  let newMsg = "I|"+power0+"|"+power1;
  if (lastMsg !== newMsg) {
    console.log("Sending power consumption update...");
    lastMsg = newMsg;
    sendMessage(newMsg);
  }
}

// Set the update timer to every 5 minutes
let timer_handle = Timer.set(300000,true,LoraUpdate,null);