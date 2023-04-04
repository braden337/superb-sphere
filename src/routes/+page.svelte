<script lang="ts">
  import type { LatLng } from 'leaflet';
  import type { LatLngExpression } from 'leaflet';
  import L from 'leaflet';
  import plus from 'open-location-code-typescript';

  let map: L.Map;
  let here: LatLngExpression;

  let code = window.location.hash.slice(1).trim();

  $: codeArea = plus.isValid(code) ? plus.decode(code) : null;

  window.onhashchange = (x) => {
    code = window.location.hash.slice(1).trim();
  };

  $: {
    console.log(code);
    if (code !== '' && plus.isValid(code)) {
      let pos = plus.decode(code);
      here = [pos.latitudeCenter, pos.longitudeCenter];
      if (map != undefined) {
        L.marker(here, { draggable: true }).addTo(map).bindPopup(code).openPopup();
        map.setView(here, 17);
      }
    }
  }

  function locateMe() {
    return new Promise<number[]>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve([position.coords.latitude, position.coords.longitude]),
        (error) => reject(error)
      );
    });
  }

  async function createMap(container: HTMLElement) {
    let m = L.map(container);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);

    if (here == undefined) {
      here = [49.8954, -97.1785];
    }

    m.setView(here, 10);

    map = m;
  }

  function mapAction(container: HTMLElement) {
    createMap(container);

    return {
      destroy: () => {
        map.remove();
      },
    };
  }

  async function findMe() {
    let pos = await locateMe();
    let plusCode = plus.encode(pos[0], pos[1]);
    window.location.hash = plusCode;
  }

  enum Map {
    Apple,
    Google,
    Waze,
  }

  function coordinatesFrom(plusCode: string) {
    let area = plus.decode(plusCode);
    return area.latitudeCenter.toFixed(5) + ',' + area.longitudeCenter.toFixed(5);
  }

  function navUrlFor(plusCode: string, map: Map) {
    const maps = {
      [Map.Apple]: 'https://maps.apple.com/?address=LATLON',
      [Map.Google]: 'https://www.google.com/maps/search/?api=1&query=LATLON',
      [Map.Waze]: 'https://waze.com/ul?ll=LATLON&navigate=yes',
    };

    return maps[map].replace('LATLON', coordinatesFrom(plusCode));
  }
</script>

<!-- <h1>Superb Sphere</h1> -->

<main>
  <div id="map" use:mapAction />
</main>

<footer>
  {#if codeArea !== null}
    <a href={navUrlFor(code, Map.Waze)} target="_blank"><button class="waze">Waze</button></a>
    <a href={navUrlFor(code, Map.Apple)} target="_blank"
      ><button class="apple">Apple Maps</button></a
    >
    <a href={navUrlFor(code, Map.Google)} target="_blank"
      ><button class="google">Google Maps</button></a
    >
  {:else}
    <button on:click={findMe} class="apple">Locate Me</button>
  {/if}
</footer>

<style>
  @import 'leaflet/dist/leaflet.css';
  :global(*) {
    margin: 0;
    padding: 0;
  }

  #map {
    height: 50vh;
  }
  footer {
    margin: 1rem;
    display: grid;
    gap: 1rem;
  }

  footer > a {
    display: grid;
    text-decoration: none;
  }

  footer button {
    cursor: pointer;
    border: none;
    border-radius: 1rem;
    padding: 1rem;
    font-size: 2rem;
  }

  .waze {
    color: white;
    background-color: #05c8f7;
  }
  .google {
    color: white;
    background-color: #20a462;
  }
  .apple {
    color: white;
    background-color: #7d7d7d;
  }
</style>
