// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

#include <Adafruit_NeoPixel.h>

Adafruit_NeoPixel strip_6(8, 6, NEO_GRB + NEO_KHZ800);

void setup() {
  strip_6.begin();
}

void loop() {
  strip_6.setPixelColor(0, strip_6.Color(255, 0, 0));
  delay(1000);
  strip_6.clear();
  delay(500);
}
