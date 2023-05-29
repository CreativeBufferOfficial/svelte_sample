<script>
    import { deleteHost } from '../lib.js';
    import * as stores from '../stores.js';
    import {get} from 'svelte/store';

    let hostEntity = get(stores.host_entity);
    let hostId = hostEntity.hostId ? hostEntity.hostId : '';
    let hostType = hostEntity.hostType ? hostEntity.hostType : '';
    let hostLanguage = hostEntity.hostLanguage ? hostEntity.hostLanguage : '';

    const deleteHostCallback = () => {
        deleteHost(hostId, hostType);
    };

</script>

<h3>Why delete a host entity?</h3>
<div class="description">
    <p>
        This step simulates the information provided to the API if a host entity at a partner platform is being deleted or no longer subscribes to the service.<br>
        every information associated with this entity is deleted on the APIs database.
    </p>
</div>
<fieldset>
    <label>Host Id</label><input type="text" bind:value="{hostId}" placeholder="a string as unique id">
    <label>Host Type</label><input type="text" bind:value="{hostType}" placeholder="'job' or 'user'"><br>
    <button on:click={deleteHostCallback}>Delete Host</button>
</fieldset>

<style>
    fieldset {
      background-color: rgba(0,0,0,0.04);
      border: none;
      margin: 2rem auto;
      max-width: 60%;
      padding: 1rem;
    }

    input, select {
      width: 100%;
      margin-bottom: 1rem;
    }

    label {
      text-align: left;
      text-transform: uppercase;
    }

</style>