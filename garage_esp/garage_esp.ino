#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <time.h>
#include <Timezone.h>
#include <TOTP.h>
#include <WiFiUdp.h>

#include <DNSServer.h>            //Local DNS Server used for redirecting all requests to the configuration portal
#include <ESP8266WebServer.h>     //Local WebServer used to serve the configuration portal
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager WiFi Configuration Magic

#include "key.h"

#define OPENER_PIN D1
#define DOOR_PIN D2

// Define NTP Client to get time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

// Timezone data from https://github.com/JChristensen/Timezone/blob/master/examples/WorldClock/WorldClock.ino
// US Pacific Time Zone (Las Vegas, Los Angeles, Seattle)
TimeChangeRule usPDT = {"PDT", Second, Sun, Mar, 2, -420};
TimeChangeRule usPST = {"PST", First, Sun, Nov, 2, -480};
Timezone timezone(usPDT, usPST);

TOTP totp = TOTP(hmacKey, 32);

ESP8266WebServer server(80);

void setup() {
  pinMode(OPENER_PIN, OUTPUT);
  pinMode(DOOR_PIN, INPUT_PULLUP);
  digitalWrite(OPENER_PIN, LOW);

  Serial.begin(115200);

  WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP

  //WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
  WiFiManager wm;

  bool res = wm.autoConnect("ESPGarage"); // password protected ap
  if (!res) {
    Serial.println("Failed to connect");
    ESP.restart();
  }

  timeClient.begin();
  timeClient.update();

  server.on("/toggle", handleToggle);
  server.on("/status", handleStatus);
  server.on("/panic", handlePanic);

  server.begin();
}

void handleToggle() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  if (server.method() == HTTP_POST) {
    IPAddress client = server.client().remoteIP();

    // Keeping the IP filtering here in case the ESP is contacted directly outside of the express proxy
    bool validIP = false;
    for (uint8_t i = 0; i < sizeof(ipAllowList) / sizeof(ipAllowList[0]); i++) {
      if (ipAllowList[i][0] == client[0] && ipAllowList[i][1] == client[1] && ipAllowList[i][2] == client[2] && ipAllowList[i][3] == client[3]) validIP = true;
    }

    if (validIP) {
      Serial.print("Valid IP: ");
      Serial.println(client.toString());
    }

    if (!validIP) {
      Serial.print("Invalid IP: ");
      Serial.println(client.toString());

      server.send(401, "text/plain", "Invalid Device ID");
      return;
    }

    String arg = server.arg("code");

    String prevCode = String(totp.getCode(timeClient.getEpochTime() - 30));
    String code = String(totp.getCode(timeClient.getEpochTime()));
    String nextCode = String(totp.getCode(timeClient.getEpochTime() + 30));

    Serial.println("Got a code: " + arg);
    Serial.println("Expected: " + code);
    Serial.println("Expected (prev): " + prevCode);

    Serial.println("Expected (next): " + nextCode);
    Serial.println("Current Time: " + String(timeClient.getEpochTime()));

    if (arg == code) {
      Serial.println("Success");
      server.send(200, "text/plain", "Success");

      openDoor();
    } else {
      Serial.println("Invalid");
      server.send(401, "text/plain", "Invalid Code");
    }
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

void openDoor() {
  digitalWrite(OPENER_PIN, HIGH);
  digitalWrite(LED_BUILTIN, LOW);
  delay(150);

  digitalWrite(OPENER_PIN, LOW);
  digitalWrite(LED_BUILTIN, HIGH);
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  bool status = digitalRead(DOOR_PIN);
  if (status) server.send(200, "application/json", "{ \"open\": true, \"time\": " + String(timeClient.getEpochTime()) + " }");
  else server.send(200, "application/json", "{ \"open\": false, \"time\": " + String(timeClient.getEpochTime()) + " }");
}

// Panic allows for opening door with the hmac key, instead of a code - just in case the device time is incorrect.
// This is over http, so don't use this unless in emergency.
void handlePanic() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String arg = server.arg("code");
  Serial.println("Got a key: " + arg);

  if (arg == secret) {
    Serial.println("Correct key sent");
    server.send(200, "text/plain", "Success");

    openDoor();
  } else {
    Serial.println("Invalid key sent");
    server.send(401, "text/plain", "Invalid Code");
  }
}

void loop() {
  timeClient.update();
  server.handleClient();
}
