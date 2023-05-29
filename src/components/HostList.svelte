<script>
  import {getAllHosts} from '../lib.js';
  import {base_host} from '../stores.js';

  let hosts = [];

  const refreshList = async () => {
    let response = await getAllHosts();
    if (response) {
      hosts = JSON.parse(response);
    }
  };

  const setBaseHost = (event) => {
    let selected = event.currentTarget.value;
    base_host.set(selected);
  };

</script>
<p>Set a previous created host entity active to handle storyline selection or match against.</p>
<p>If no host is available create one first.</p>
<p><strong>This is no real API step because host id and type should be direct submitted from the client platform.</strong></p>

{#if hosts.length > 0}
<select on:change={setBaseHost}>
    <option>- All -</option>
    {#each hosts as host}
        <option value="{JSON.stringify(host)}">HostId: {host.HostEntityId} Type: {host.HostEntityType}</option>
    {/each}
</select>
{/if}

<button on:click={refreshList}>
  Refresh Host List
</button>