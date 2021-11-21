## Shelly Script Examples

This document contains a few Shelly Plus script examples. Scripts are a new feature in Shelly Plus devices that are available from the 0.9.0-beta2 firmware. Since this is a beta firmware you need to install it manually (will not get updated automatically). You can do it like any firmware update from the app or web interface under Device/Firmware.

Official Shelly documentation can be found here: https://shelly-api-docs.shelly.cloud/gen2/Scripts/Tutorial

## Tutorial Videos

Examples below explained in detail in this video:

[![Prototype](https://img.youtube.com/vi/Mz1dJGthIJk/0.jpg)](https://www.youtube.com/watch?v=Mz1dJGthIJk)

### Simple flasher cycle

This script toggles the relay (output 0) on and off. Both and off cycle is 1 second.

```
function callback(userdata) {
  Shelly.call("Switch.Toggle","{ id:0 }",null,null);
}

let timer_handle = Timer.set(1000,true,callback,null); 
```


### Asymmetric cycle

This script toggles the relay (output 0) on and off. On time is 1 second, off time is 2 seconds.

```
let bool = false;
let timer_handle = null;

function callback(userdata) {
  bool = !bool;
  print("Executed: ",bool);
  
  if (bool) {
    // turn on and start on-delay
    Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
    timer_handle = Timer.set(1000,false,callback,null); 
  } else {
    // turn off and start off-delay
    Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
    timer_handle = Timer.set(2000,false,callback,null); 
  }
}

callback(null);
```


### Event handler

This script listens to button down even and starts and stops the asymetric cycle (see above)

```
let userdata = null;
let state = false;
let bool = false;
let timer_handle = null;

function timercallback(userdata) {
  bool = !bool;
  if (bool) {
    // turn on and start on-delay
    Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
    timer_handle = Timer.set(1000,false,timercallback,null); 
  } else {
    // turn off and start off-delay
    Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
    timer_handle = Timer.set(2000,false,timercallback,null); 
  }
}
 
 
 function eventcallback(userdata) {
   print("Event called: ", JSON.stringify(userdata));
   // check if this a button press event
   if (userdata.info.event==="btn_down") {
     print("button down event");
     state = !state;
     if (state) {
       timercallback(null);
     } else {
       Timer.clear(timer_handle);
     }
   }
 }
 
 Shelly.addEventHandler(eventcallback, userdata);
```


### Remote script call

This script calls a 3rd party web service with a JSON response

```
Shelly.call("HTTP.GET", { url: "http://192.168.1.91/rpc/Script.Start?id=1" },
    function (res, error_code, error_msg, ud) {
        if (res.code === 200) {
            print("Successfully transmitted a message");
        };
    },
    null);
```


### Control two devices

This script also listens to button down event on the first input and start/stops a script on another device (192.168.1.91) and also toggles the local output:

```
let userdata = null;
let state = false;
let bool = false;
 
 function eventcallback(userdata) {
   // check if this a button press event
   if (userdata.info.event==="btn_down") {
     print("button down event");
     state = !state;
     if (state) {
       // Start script on the other Shelly
        Shelly.call("HTTP.GET", { url: "http://192.168.1.91/rpc/Script.Start?id=1" },
            function (res, error_code, error_msg, ud) {
                if (res.code === 200) {
                    print("Successfully transmitted a message");
                };
          },
          null);
         // Turn the output on
         Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
       
                 } else {
       // Stop script on the other Shelly
        Shelly.call("HTTP.GET", { url: "http://192.168.1.91/rpc/Script.Stop?id=1" },
            function (res, error_code, error_msg, ud) {
                if (res.code === 200) {
                    print("Successfully transmitted a message");
                };
          },
          null);
         // Turn the output off
         Shelly.call("Switch.Set","{ id:0, on:false }",null,null);       
       
     }
   }
 }
 
 Shelly.addEventHandler(eventcallback, userdata);
```


### Public websevice call

This script calls a random public API which has a JSON response and toggles the output based on the value in the response.

```
         Shelly.call("HTTP.GET", { url: "https://api.agify.io/?name=meelad" },
            function (res, error_code, error_msg, ud) {
                if (res.code === 200) {
                    let resobj = JSON.parse(res.body);
                    print("Age: ", resobj.age);
                    if (resobj.age>30) {
                      Shelly.call("Switch.Set","{ id:0, on:true }",null,null);
                    } else {
                      Shelly.call("Switch.Set","{ id:0, on:false }",null,null);
                    }
                };
          },
          null);
```
