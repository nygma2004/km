let num_objects = 0;
let illumination = "";
let maxz = 0;

// Handles for virtual components
let VCMaxz = Virtual.getHandle("number:200");
let VCDet = Virtual.getHandle("enum:200");

Shelly.addEventHandler(function (event) {
  // for debugging
  // console.log("Event: ",JSON.stringify(event));

  // Get the illumination value
  if (typeof event === "object" && event.component === "illuminance:0" && event.info && event.info.event === "illuminance_update") {
    if (illumination !== event.info.illumination) { // sensor sends too many updates, ignore if there is no change
      illumination = event.info.illumination;
      console.log("Illumination: ", illumination);
      updateValues();
    }
  }  
  
  // Get the coordinates from track events
  if (typeof event === "object" && event.component === "presence" && event.info && event.info.event === "track") {
    let max = 0;
    for (let i=0; i < event.info.object.length; i++) {
      if (event.info.object[i].maxz > max) {
        max = event.info.object[i].maxz;
      }
    }
    maxz = max;
    console.log("Maxz: ", maxz );
    updateValues();

  }  

});


Shelly.addStatusHandler(function (status) {
  // for debugging
  // console.log("Status: ",JSON.stringify(status))

  // Save the current number of objects in the zone for later processing
  if (typeof status === "object" && status.component === "presencezone:201" && status.delta) {
    num_objects = status.delta.num_objects;
    console.log("Objects: ", num_objects);
    updateValues();
  }
});

function updateValues() {
  if (num_objects === 0) {
    VCMaxz.setValue(maxz);
    if (VCDet.getValue() !== "absent") {
      VCDet.setValue("absent");
      console.log("New status: Absent");
    }
  } else {
    VCMaxz.setValue(maxz);
    if (maxz > 1.5) {
      if (VCDet.getValue() !== "standing") {
        VCDet.setValue("standing");  
        console.log("New status: Standing");
      }
    }
    if (maxz < 1.45) {
      if (VCDet.getValue() !== "seated") {
        VCDet.setValue("seated");  
        console.log("New status: Seated");
      }
    }
      
  }
  
  
}