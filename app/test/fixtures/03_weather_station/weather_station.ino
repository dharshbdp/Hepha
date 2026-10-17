// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

#include <DHT.h>

DHT dht_2(2, DHT11);

void setup() {
  dht_2.begin();
  Serial.begin(115200);
}

void loop() {
  Serial.print("temp:");
  Serial.println(dht_2.readTemperature());
  delay(2000);
}
