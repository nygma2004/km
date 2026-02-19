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
	
	// Process the received data as JSON
	var jsondata = JSON.parse(data);
	print("Counter: ",jsondata.counter);
});