// ==========================================
// Hepha — Generated Sketch
// Target: Arduino Compatible (C++)
// ==========================================

#include <Servo.h>

Servo servo_9;

long readUltrasonicDistance(int triggerPin, int echoPin) {
  pinMode(triggerPin, OUTPUT);
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);
  pinMode(echoPin, INPUT);
  return pulseIn(echoPin, HIGH) * 0.034 / 2;
}

void setup() {
  servo_9.attach(9);
}

void loop() {
  if (readUltrasonicDistance(7, 8) < 20) {
    servo_9.write(180);
    delay(400);
  } else {
    servo_9.write(90);
    delay(100);
  }
}
