#include <Wire.h>

const int buttonPin = 2;
unsigned long lastMeasurement = 0;
const unsigned long IDLE_POLL_INTERVAL = 20000;  // 20 seconds when nobody touches it

void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(buttonPin, INPUT_PULLUP);

  Serial.println(F("\nSmartSeat — fully automatic occupancy sensor"));
  Serial.println(F("Press button or wait ~20 s for auto-check\n"));
}

void loop() {
  bool buttonPressed = (digitalRead(buttonPin) == LOW);

  // Manual trigger
  if (buttonPressed) {
    delay(30);
    if (digitalRead(buttonPin) == LOW) {
      Serial.println(F("{\"event\":\"click\"}"));   // instant feedback to frontend
      doMeasurement();
      lastMeasurement = millis();

      while (digitalRead(buttonPin) == LOW) delay(10);  // wait for release
      delay(200);
      return;
    }
  }

  // Automatic background polling when nothing happened for a while
  if (millis() - lastMeasurement > IDLE_POLL_INTERVAL) {
    doMeasurement();
    lastMeasurement = millis();
  }
}

// -------------------------------------------------------------
// One single function that does the full 5-second measurement
// -------------------------------------------------------------
void doMeasurement() {
  float t1 = readTemp();
  Serial.print(F("Start: "));
  Serial.print(t1, 3);
  Serial.println(F(" °C"));

  delay(5000);                     // wait 5 seconds

  float t2 = readTemp();
  float diff = t2 - t1;

  Serial.print(F("After 5s: "));
  Serial.print(t2, 3);
  Serial.println(F(" °C"));

  Serial.print(F("Change: "));
  Serial.print(diff > 0 ? "+" : "");
  Serial.print(diff, 3);
  Serial.println(F(" °C\n"));

  // Clean JSON for Node-RED / frontend
  Serial.print(F("JSON:"));
  Serial.print(F("{\"event\":\"measure\",\"t1\":"));
  Serial.print(t1, 3);
  Serial.print(F(",\"t2\":"));
  Serial.print(t2, 3);
  Serial.print(F(",\"diff\":"));
  Serial.print(diff, 3);
  Serial.println(F(",\"unit\":\"C\"}"));
}

// -------------------------------------------------------------
// Read temperature from MCP9808 (exact same as before)
// -------------------------------------------------------------
float readTemp() {
  // Wake
  Wire.beginTransmission(0x18);
  Wire.write(0x01); Wire.write(0x00); Wire.write(0x00);
  Wire.endTransmission();
  delay(260);

  // Read register 0x05
  Wire.beginTransmission(0x18);
  Wire.write(0x05);
  Wire.endTransmission(false);
  Wire.requestFrom(0x18, 2);
  uint8_t hi = Wire.read();
  uint8_t lo = Wire.read();

  // Sleep again (saves power)
  Wire.beginTransmission(0x18);
  Wire.write(0x01); Wire.write(0x01); Wire.write(0x00);
  Wire.endTransmission();

  int16_t raw = (hi << 8) | lo;
  raw &= 0x1FFF;
  if (raw & 0x1000) raw -= 4096;
  return raw * 0.0625;
}