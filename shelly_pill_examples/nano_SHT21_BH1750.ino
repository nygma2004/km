#include <Wire.h>
#include <SHT2x.h>      // Library for SHT21/HTU21D
#include <hp_BH1750.h>
#include <ArduinoJson.h>
#include <math.h>

// Sensor instance for Light
hp_BH1750 bh1750;

// Sensor instance for temperature and humidity
SHT2x sht;

void setup() {
  Serial.begin(9600);
  Wire.begin();
  
  while (!Serial); // Wait for Serial Monitor

  // Initialize the SHT sensor
  sht.begin();

  // Initialize BH1750
  if (!bh1750.begin(BH1750_TO_GROUND)) {
    Serial.println(F("Could not find BH1750 sensor!"));
    while (1);
  }
  
  // SHT21 doesn't usually require a .begin() call with the standard SHT2x library,
  // as it simply communicates over the Wire bus at address 0x40.
}

void loop() {
  // 1. Read SHT21 data
  sht.read();
  float temp = sht.getTemperature();
  float humidity = sht.getHumidity();
  
  // 2. Read BH1750 data
  bh1750.start();
  float lux = bh1750.getLux();

  // 3. Create JSON document
  StaticJsonDocument<200> doc;

  doc["temp"] = (float)round(temp*10)/10.0;
  doc["humi"] = round(humidity);
  doc["light"] = round(lux);

  // 4. Serialize and Send
  serializeJson(doc, Serial);
  Serial.println(); 

  delay(1000); // Wait 1 second
}