Shelly.addStatusHandler(function (status) {
  // for debugging
  console.log("Status: ",JSON.stringify(status));

  if (typeof status === "object" && status.component === "bthomesensor:202" && status.delta) {
    console.log("Temperature: ",status.delta.value)
  } 
  if (typeof status === "object" && status.component === "bthomesensor:201" && status.delta) {
    console.log("Humidity: ",status.delta.value)
  } 



});