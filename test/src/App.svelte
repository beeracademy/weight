<script lang="ts">
  import { requestPort, Port } from "./lib/serial.js";

  let port: Port | undefined;
  let connected = false;

  let buttonPressed = false;
  let weightValue = NaN;

  let buffer = "";

  function handleLine(line: string): void {
    const parts = line.split(" ");
    if (parts.length !== 3) {
      return;
    }
    const [startString, buttonString, weightString] = parts;
    if (startString !== "#") {
      return;
    }
    buttonPressed = buttonString === "1";
    weightValue = parseInt(weightString);
  }

  async function connect(): Promise<void> {
    port = await requestPort();
    await port.connect(
      (data) => {
        buffer += new TextDecoder().decode(data);
        let newlineIndex = buffer.indexOf("\n");
        if (newlineIndex !== -1) {
          handleLine(buffer.slice(0, newlineIndex));
          buffer = buffer.slice(newlineIndex + 1);
        }
      },
      (error) => {
        console.error("Got error:", error);
      }
    );
    connected = true;
  }

  async function disconnect(): Promise<void> {
    await port?.disconnect();
    connected = false;
  }

  enum LedColor {
    OFF = "O",
    GREEN = "G",
    RED = "R",
    YELLOW = "Y",
  }

  let color = LedColor.OFF;

  async function setColor(color: LedColor): Promise<void> {
    port?.send(new TextEncoder().encode(color));
  }

  $: setColor(color);

  let webUsbSupported = navigator.usb !== undefined;
</script>

<main>
  <h1>Academy Weight Test</h1>

  {#if webUsbSupported}
    {#if !connected}
      <button on:click={connect}>Connect Weight</button>
    {:else}
      <h2>LED color</h2>
      {#each Object.entries(LedColor) as [name, value]}
        <label>
          <input type="radio" bind:group={color} {value} />
          {name}
        </label>
      {/each}
      <br />
      <p>
        Button pressed: {buttonPressed ? "✅" : "❌"}
      </p>
      <p>
        Weight reading: {weightValue}
      </p>
      <br />
      <button on:click={disconnect}>Disconnect Weight</button>
    {/if}
  {:else}
    <p>
      <a href="https://developer.mozilla.org/en-US/docs/Web/API/USB">WebUSB</a> is
      not supported in your browser. Try opening the page in Chrome.
    </p>
  {/if}
</main>

<style>
</style>
