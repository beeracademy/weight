#include <HX711.h>
#include <WebUSB.h>
#include "enums.h"

WebUSB WebUSBSerial(0, "localhost:5173");

constexpr int LED_GREEN_PIN = 5;
constexpr int LED_RED_PIN = 6;
constexpr int BUTTON_PIN = 7;

constexpr int LOADCELL_DOUT_PIN = 20;
constexpr int LOADCELL_SCK_PIN = 21;

HX711 loadcell;

#define Serial WebUSBSerial

void set_led_color(LedColor color) {
  bool red_on = color == RED || color == YELLOW;
  bool green_on = color == GREEN || color == YELLOW;

  digitalWrite(LED_RED_PIN, !red_on);
  digitalWrite(LED_GREEN_PIN, !green_on);
}

void setup() {
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);

  while (!Serial) {
    set_led_color(RED);
    delay(200);
    set_led_color(OFF);
    delay(200);
  }

  Serial.begin(9600);

  loadcell.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
}

void loop() {
    if (!Serial) return;

    if (Serial.available()) {
      int v = Serial.read();

      switch (v) {
        case OFF:
        case GREEN:
        case RED:
        case YELLOW:
          set_led_color(static_cast<LedColor>(v));
          break;
        default:
          break;
      }
    }

    Serial.print("# ");
    Serial.print(digitalRead(BUTTON_PIN));
    Serial.print(" ");
    Serial.print(loadcell.read());
    Serial.println("");
    Serial.flush();
}
