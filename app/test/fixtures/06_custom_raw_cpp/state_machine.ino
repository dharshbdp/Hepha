// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  static uint8_t state = 0;
  switch (state) { case 0: state = 1; break; default: state = 0; }
  delay(100);
}
