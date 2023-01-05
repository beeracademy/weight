export class Port {
  private interfaceNumber = 2; // original interface number of WebUSB Arduino demo
  private endpointIn = 5; // original in endpoint ID of WebUSB Arduino demo
  private endpointOut = 4; // original out endpoint ID of WebUSB Arduino demo
  private disconnecting = false;

  constructor(private device: any) {}

  public async connect(
    onReceive: (data: DataView) => void,
    onReceiveError: (error: Error) => void
  ): Promise<void> {
    await this.device.open();
    if (this.device.configuration === null) {
      await this.device.selectConfiguration(1);
    }

    for (const cInterface of this.device.configuration.interfaces) {
      for (const alternate of cInterface.alternates) {
        if (alternate.interfaceClass == 0xff) {
          this.interfaceNumber = cInterface.interfaceNumber;

          for (const endpoint of alternate.endpoints) {
            if (endpoint.direction === "out") {
              this.endpointOut = endpoint.endpointNumber;
            }
            if (endpoint.direction === "in") {
              this.endpointIn = endpoint.endpointNumber;
            }
          }
        }
      }
    }

    await this.device.claimInterface(this.interfaceNumber);
    await this.device.selectAlternateInterface(this.interfaceNumber, 0);

    // The vendor-specific interface provided by a device using this
    // Arduino library is a copy of the normal Arduino USB CDC-ACM
    // interface implementation and so reuses some requests defined by
    // that specification. This request sets the DTR (data terminal
    // ready) signal high to indicate to the device that the host is
    // ready to send and receive data.
    await this.device.controlTransferOut({
      requestType: "class",
      recipient: "interface",
      request: 0x22,
      value: 0x01,
      index: this.interfaceNumber,
    });

    this.readLoop(onReceive, onReceiveError);
  }

  public async disconnect(): Promise<void> {
    this.disconnecting = true;
    // This request sets the DTR (data terminal ready) signal low to
    // indicate to the device that the host has disconnected.
    await this.device.controlTransferOut({
      requestType: "class",
      recipient: "interface",
      request: 0x22,
      value: 0x00,
      index: this.interfaceNumber,
    });
    await this.device.close();
    this.disconnecting = false;
  }

  private async readLoop(
    onReceive: (data: DataView) => void,
    onReceiveError: (error: Error) => void
  ): Promise<void> {
    try {
      const result = await this.device.transferIn(this.endpointIn, 64);
      onReceive(result.data);
      this.readLoop(onReceive, onReceiveError);
    } catch (error) {
      if (this.disconnecting) {
        return;
      }
      if (error instanceof Error) {
        onReceiveError(error);
      }
    }
  }

  public async send(data: Uint8Array): Promise<void> {
    await this.device.transferOut(this.endpointOut, data);
  }
}

export async function getPorts(): Promise<Port[]> {
  const devices = await navigator.usb.getDevices();
  return devices.map((device: any) => new Port(device));
}

export async function requestPort(): Promise<Port> {
  const filters = [
    { vendorId: 0x2341, productId: 0x8037 }, // Arduino Micro
  ];
  const device = await navigator.usb.requestDevice({ filters });
  return new Port(device);
}
