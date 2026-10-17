// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

void setup() {
  pinMode(13, OUTPUT);
  pinMode(9, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  analogWrite(9, 255);
  delay(500);
  digitalWrite(13, LOW);
  analogWrite(9, 64);
  delay(500);
}
