<script>

  import {getAllHosts, getMatching} from "../lib";
  import {base_host} from '../stores.js'
  import Host from "./Host.svelte";
  import {get} from "svelte/store";

  let initial = true;

  let allHosts = [];
  let filteredHosts = [];
  let matchingHosts = [];

  let baseHost = '';

  const getFilterHosts = async () => {
    let response = await getAllHosts();
    if (response) {
      allHosts = JSON.parse(response);
    }
  }

  const getMatchingHosts = async () => {
    baseHost = JSON.parse(get(base_host));
    let response = await getMatching(baseHost.HostEntityType, baseHost.HostEntityId, filteredHosts);
    if (response) {
      console.log(response);
      matchingHosts = response;
      initial = false;
    }
  }
</script>
{#if initial}
    <h3>1. Get a filter list.</h3>
    <p>To only match a prefilterd list of options we need to simulate a filter process by selection in the ui.</p>
    <button on:click={getFilterHosts}>Get all current hosts</button>
    {#if (allHosts.length > 0)}
    <fieldset>
        {#each allHosts as host }
            {#if (JSON.stringify(host) != get(base_host)) }
                <label>
                    <input type="checkbox" bind:group={filteredHosts} value="{JSON.stringify(host)}"/>
                    HostId: {host.HostEntityId} Type: {host.HostEntityType}
                </label>
            {/if}
        {/each}
    </fieldset>
    {/if}
    <h3>2. Get Matchings</h3>
    <p>Annotate the filterd list with matching results</p>
    <button on:click={getMatchingHosts}>Get matches</button>
{/if}
{#if matchingHosts }
    <h3>Matches</h3>
    {#if matchingHosts.length > 0 }
        <ul>
            {#each matchingHosts as host }
                <li>
                    <Host host={host}/>
                </li>
            {/each}
        </ul>
    {:else}
        <p>No matching hosts found.</p>
    {/if}
{/if}

<style>
  label {
    display: inline;
  }
  ul {
    list-style: none;
  }

  li {
    border: 1px solid #ccc;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
    margin-bottom: 1rem;
    padding: 1rem;
  }
</style>