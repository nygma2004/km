const BAUD = 9600;
const uart = UART.get();

// ---- init ----
if (!uart.configure({ baud: BAUD, mode: "8N1" })) {
	print("Unable to configure UART @ " + BAUD);
	die();
}

uart.recv(function (data) {
	if (!data || !data.length) return;
	
	// Output the received data as text
	print("New data: ",data);
	
	// Update the virtual components
	var jsondata = JSON.parse(data);

	Shelly.call("Boolean.Set",{ id:200, value:jsondata.state },null,null);
	Shelly.call("Enum.Set",{ id:201, value:jsondata.signal},null,null);
	Shelly.call("Number.Set",{ id:200, value:jsondata.level},null,null);


});

Shelly.addStatusHandler(function (status) {
  // for debugging
  console.log("Status: ",JSON.stringify(status));
  
  // Radio on/off button
  if (typeof status === "object" && status.component === "boolean:200" && status.delta) {
      if (status.delta.value) {
        console.log("Turning on the radio");
        uart.write("{\"state\":1}\n");
      } else {
        console.log("Turning off the radio");
        uart.write("{\"state\":0}\n");
      } 
  }
  
  // Changing station
  if (typeof status === "object" && status.component === "enum:200" && status.delta) {
      console.log("Changing station to: ", status.delta.value);
      uart.write("{\"setfreq\":"+status.delta.value+"}\n");
  }
});