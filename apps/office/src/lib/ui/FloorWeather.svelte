<script lang="ts">
  import { chooseStation, readWeather, weather } from './weather.svelte.ts';

  let code = $state('');
</script>

<details class="mt-1 text-xs text-muted">
  <summary class="cursor-pointer hover:text-ink">
    {#if weather.report}
      {weather.station} · {weather.report.sky}{#if weather.report.temperature !== null}
        · {weather.report.temperature} °C{/if}
    {:else if weather.station}
      {weather.station} · {weather.checking ? 'Checking weather…' : 'Weather unavailable'}
    {:else}
      Weather
    {/if}
  </summary>
  <form
    class="mt-2 grid gap-1.5"
    onsubmit={(e) => {
      e.preventDefault();
      chooseStation(code);
    }}
  >
    <label>
      Airport station code
      <input
        class="mt-1 w-full rounded bg-night px-2 py-1 text-ink uppercase"
        placeholder="KSEA"
        bind:value={code}
        pattern={'[A-Za-z0-9]{4}'}
        maxlength="4"
        required
      />
    </label>
    <p>
      Sends this code to the U.S. Aviation Weather Center for the latest report, then checks hourly.
    </p>
    <div class="flex flex-wrap gap-3">
      <button class="underline" type="submit">Show weather</button>
      {#if weather.station}
        <button
          class="underline"
          type="button"
          onclick={() => {
            code = '';
            chooseStation('');
          }}>Turn off</button
        >
      {/if}
    </div>
  </form>
  {#if weather.report}
    <p class="mt-1">
      {weather.report.name} · Observed {new Date(weather.report.at).toLocaleString()}
    </p>
  {:else if weather.problem}
    <p class="mt-1" role="status">
      {weather.problem} <button class="underline" onclick={readWeather}>Try again</button>
    </p>
  {/if}
</details>
