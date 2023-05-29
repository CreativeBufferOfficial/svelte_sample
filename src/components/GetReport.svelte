<script>
    import {getReport} from '../lib.js';
    import {base_host} from '../stores.js';
    import {get} from "svelte/store";


    // Implementing arrays of reports -
    let report = '';
    const getCurrentReport = async () => {
      // Call with example id and type
      //let response = await getStoryline('user', '111');

      // Take current host from stored value
      let currentHost = JSON.parse(get(base_host));
      let response = await getReport(currentHost.HostEntityType, currentHost.HostEntityId);
      if(response) {
          report = response.Report;
      }
    }
</script>
<button on:click={getCurrentReport}>Get Report</button>
{#if report.length > 0 }
<h3>Current report selection</h3>
  <p>
      Getting the currently selected report for a given storyline / host. Report text or false
  </p>
   <div>
       {report}
   </div>
{/if}

<style>

</style>