# User requirments

- A browser supporting [WebUSB](https://caniuse.com/webusb) such as Google Chrome.
- For Linux: See below.

## Udev rule for Linux

A udev rule for making the USB device available to non-root users is required.

`50-arduino.rules` contains a udev rule that should work as long as your user is part of the `wheel` group.
To install it run
```sh
cp 50-arduino.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

You might need to unplug and plug in the device again.

# Development

Install the following Arduino libraries:
- [HX711](https://github.com/bogde/HX711)
- [WebUSB](https://github.com/webusb/arduino)

Make sure to patch the `USB_VERSION` variable in `USBCore.h` in `~/.arduino15/packages/arduino/hardware/avr/1.8.6/cores/arduino/USBCore.h`.
