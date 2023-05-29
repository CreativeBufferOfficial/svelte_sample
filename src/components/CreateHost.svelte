<script>
    import { createHost } from '../lib.js';
    import * as stores from '../stores.js';
    import {get} from 'svelte/store';

    let hostEntity = get(stores.host_entity);
    let hostId = hostEntity.hostId ? hostEntity.hostId : '';
    let hostType = hostEntity.hostType ? hostEntity.hostType : '';
    let hostLanguage = hostEntity.hostLanguage ? hostEntity.hostLanguage : 'en';

    const setHost = () => {
      if (stores.access_token.toString() !== '') {
        createHost(hostId, hostType, hostLanguage);
        stores.host_entity.set({'hostId': hostId, 'hostType': hostType, 'hostLanguage': hostLanguage});
      } else {
        console.log('Login first');
      }
    };

</script>

<h3>Why create a host entity?</h3>
<div class="description">
    <p>
        This step simulates the information provided to the API if a new host entity at a partner platform is getting ready to use the matching service for the first time.<br>
        It could be invoked on initial user registration, booking of a paid service or first use of the storyline creation interface.<br>
        Every entity using the matching service or should be matched against have to create such a host entity.
    </p>
</div>
<fieldset>
    <label>Host Id</label><input type="text" bind:value="{hostId}" placeholder="a string as unique id">
    <label>Host Type</label><input type="text" bind:value="{hostType}" placeholder="'job' or 'user'"><br>
    <label>Host Language</label><select type="text" bind:value="{hostLanguage}"><option value="en">EN</option><option value="de">DE</option></select><br>
    <button on:click={setHost}>Create Host</button>
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