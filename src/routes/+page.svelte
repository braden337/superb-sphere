<script lang="ts">
  import type { LeafletEventHandlerFn } from 'leaflet';
  import L from 'leaflet';
  import OpenLocationCode from 'open-location-code-typescript';

  interface NavigationApp {
    name: string;
    url: string;
    tint: string;
  }

  let map: L.Map;
  let marker: L.Marker;

  let code: string = '';
  let tileURL: string = '';

  refreshCode();
  window.onhashchange = refreshCode;

  function refreshCode() {
    code = window.location.hash.match('#/(?<plusCode>.+)')?.groups?.plusCode ?? '';
  }

  $: isValidCode = OpenLocationCode.isValid(code);

  $: area = isValidCode ? OpenLocationCode.decode(code) : null;

  $: zoom = isValidCode ? 15 : 3;

  $: lat = area?.latitudeCenter ?? 47.1164;
  $: lon = area?.longitudeCenter ?? -101.2996;

  $: ll = [lat, lon].map((n) => n.toFixed(5)).join(',');

  $: navigationApps = [
    {
      name: 'Waze',
      url: `https://waze.com/ul?ll=${ll}&navigate=yes`,
      tint: '#05c8f7',
    },
    {
      name: 'Apple Maps',
      url: `https://maps.apple.com/?address=${ll}`,
      tint: '#7d7d7d',
    },
    {
      name: 'Google Maps',
      url: `https://www.google.com/maps/search/?api=1&query=${ll}`,
      tint: '#20a462',
    },
  ] as NavigationApp[];

  $: {
    marker?.removeFrom(map);
    map?.setView([lat, lon], zoom);

    if (map && isValidCode) {
      marker = L.marker([lat, lon]);
      marker.addTo(map);
      marker.bindPopup(code.toUpperCase(), { className: 'popup' }).openPopup();

      const zoom = 15;

      const x = Math.floor(((lon + 180) / 360) * (1 << zoom));

      let y = 1 - Math.log(Math.tan(toRad(lat)) + 1 / Math.cos(toRad(lat))) / Math.PI;
      y = Math.floor(y * 0.5 * (1 << zoom));

      const subdomains = ['a', 'b', 'c'];
      const s = subdomains[Math.floor(Math.random() * subdomains.length)];

      tileURL = `https://${s}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    }
  }

  $: {
    if (tileURL !== '') {
      ['icon', 'apple-touch-icon'].forEach((icon) => {
        document.querySelector(`[rel=${icon}]`)?.remove();

        const link = document.createElement('link');

        link.href = tileURL;
        link.rel = icon;

        document.head.appendChild(link);
      });
    }
  }

  function toRad(n: number) {
    return (n * Math.PI) / 180;
  }

  function move(lat: number, lon: number) {
    window.location.hash = `/${OpenLocationCode.encode(lat, lon)}`;
  }

  async function locateMe() {
    const [lat, lon] = await getGeoLocation();
    move(lat, lon);
  }

  function getGeoLocation() {
    return new Promise<number[]>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve([position.coords.latitude, position.coords.longitude]),
        (error) => reject(error)
      );
    });
  }

  function mapAction(container: HTMLElement) {
    let m = L.map(container);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);

    m.setView([lat, lon], zoom);

    m.on('contextmenu', (e) => {
      move(e.latlng.lat, e.latlng.lng);
    });

    map = m;

    return {
      destroy() {
        map.remove();
      },
    };
  }
</script>

<main>
  <div id="map" use:mapAction />
</main>

<footer>
  {#if isValidCode}
    {#each navigationApps as app}
      <a href={app.url} target="_blank">
        <button style="background-color: {app.tint}">{app.name.toUpperCase().slice(0, 4)}</button>
      </a>
    {/each}
  {:else}
    <button on:click={locateMe}>Locate Me</button>
  {/if}
</footer>

<style>
  @import 'leaflet/dist/leaflet.css';

  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html) {
    height: -webkit-fill-available;
  }

  :global(body) {
    height: 100vh;
    height: -webkit-fill-available;
    display: grid;
    grid-template-rows: 1fr auto;
  }

  #map {
    height: 100%;
  }

  #map, footer button {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  footer {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin: 1rem;
    margin-bottom: calc(1rem + env(safe-area-inset-bottom, 1rem));
  }

  footer > a {
    text-decoration: none;
  }

  footer button {
    cursor: pointer;
    border: none;
    border-radius: 1rem;
    padding: 1rem;
    font-size: 1.5rem;
    color: white;
    background-color: black;
  }

  :global(.popup) {
    font-family: 'Courier New', Courier, monospace;
  }
</style>
