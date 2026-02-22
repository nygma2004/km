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
	// print("New data: ",data);
	
	// Update the virtual components
	var jsondata = JSON.parse(data);
	Shelly.call("Number.Set",{ id:200, value:jsondata.temp },null,null);
	Shelly.call("Number.Set",{ id:201, value:jsondata.humi },null,null);
	Shelly.call("Number.Set",{ id:202, value:jsondata.light },null,null);
	print("Temperature: ",jsondata.temp,"C, Humidity: ",jsondata.humi,"%, Light level: ",jsondata.light," lux");

});