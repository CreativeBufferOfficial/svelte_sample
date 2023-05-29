<script>
    import {getStoryline} from '../lib.js';
    import {base_host} from '../stores.js';
    import {get} from "svelte/store";


    let stories = [];
    const getCurrentStoryline = async () => {
      // Call with example id and type
      //let response = await getStoryline('user', '111');

      // Take current host from stored value
      let currentHost = JSON.parse(get(base_host));
      let response = await getStoryline(currentHost.HostEntityType, currentHost.HostEntityId);
      if(response) {
          stories = response.Stories;
      }
    }
</script>
<button on:click={getCurrentStoryline}>Get Storyline</button>
{#if stories.length > 0 }
<h3>Current story selection</h3>
  <p>
      Getting the current storyline is useful for end users to check their previous selection if it still fits. This endpoint can also be used as a starting point for pause / resume function in the story selection process.
  </p>
    <fieldset>
    <ol>
  {#each stories as story}
      <li>{story.Title}</li>
  {/each}
    </ol>
    </fieldset>
{/if}

<style>
  fieldset {
    background-color: rgba(0,0,0,0.04);
    border: none;
    margin: 2rem auto;
    max-width: 60%;
    padding: 1rem;
    text-align: left;
  }
</style>