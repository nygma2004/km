#include <Wire.h>
#include <ArduinoJson.h>
#include <TEA5767N.h>

//Constants:
TEA5767N Radio = TEA5767N();

//Variables:
double old_frequency;
double frequency;
int search_mode = 0;
int search_direction;
unsigned long last_pressed;
unsigned char buf[5];
int stereo;
int signal_level;
double current_freq;
unsigned long current_millis = millis();
int inByte;
int flag=0;
bool state=false;

void setup() {
  //Init
  Serial.begin(9600);
  Radio.selectFrequency(89.5);
  Radio.mute();
  flag = 0;
}

void loop() {

  

  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');  // Read until newline
    StaticJsonDocument<200> incoming;
    DeserializationError error = deserializeJson(incoming, input);
    if(error) {
      // The input was not a JSON message, ignore it
      // Serial.println("Input is not a json");
    } else {
      // Changing the frequency: {"setfreq": 89.5}
      if (incoming["setfreq"].is<float>()) {
        Radio.selectFrequency(incoming["setfreq"]);
        flag = 0;
        state = true;
      }
      // The the radio on/off: {"state": 0} {"state": 1}
      if (incoming["state"].is<int>()) {
        if (incoming["state"] == 0) {
          Radio.mute();
          flag = 0;
          state = false;
        }
        if (incoming["state"] == 1) {
          Radio.turnTheSoundBackOn();
          flag = 0;
          state = true;
        }
      }
      // Serial.print("JSON input: ");
      // serializeJson(incoming, Serial);
      // Serial.println(); 

    }

  }

  // Read the radio status
  if (flag == 0) {
    StaticJsonDocument<200> doc;
    doc["state"] = state;
    doc["signal"] = Radio.isStereo() ? "Stereo" : "Mono";
    doc["freq"] = (float)round(Radio.readFrequencyInMHz()*10)/10.0;
    doc["level"] = Radio.getSignalLevel();
    flag =1;
    // Send the status    
    serializeJson(doc, Serial);
    Serial.println(); 
  }

 
  delay(250);

}