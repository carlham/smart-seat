#include <Wire.h>
#define MCP9808_ADDR 0x18
#define MCP9808_REG_TEMP 0x05

void setup() {
  Serial.begin(9600);
  Wire.begin();
}

void loop() {
  Wire.beginTransmission(MCP9808_ADDR);
  Wire.write(MCP9808_REG_TEMP);
  Wire.endTransmission();

  Wire.requestFrom(MCP9808_ADDR, 2);
  if (Wire.available() == 2) {
    uint16_t t = (Wire.read() << 8) | Wire.read();
    float temp = (t & 0x0FFF) / 16.0;
    if (t & 0x1000) temp -= 256;
    Serial.println(temp, 2);  // e.g. 23.75
  }
  delay(2000);
}