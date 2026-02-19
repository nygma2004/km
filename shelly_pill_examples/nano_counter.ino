// Variable to store the incrementing value
int counter = 0;

void setup() {
  // Initialize serial communication at 9600 bits per second
  Serial.begin(9600);
}

void loop() {
  // Print the formatted string to the serial monitor
  Serial.print("{ \"counter\": ");
  Serial.print(counter);
  Serial.println(" }");

  // Increment the counter by 1
  counter++;

  // Wait for 1000 milliseconds (1 second)
  delay(1000);
}