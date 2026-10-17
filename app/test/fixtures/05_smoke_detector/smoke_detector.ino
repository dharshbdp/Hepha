// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

void setup() {
  pinMode(8, OUTPUT);
}

void loop() {
  if (analogRead(A0) > 400) {
    digitalWrite(8, HIGH);
  } else {
    digitalWrite(8, LOW);
  }
}
