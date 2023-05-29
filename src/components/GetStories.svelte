<script>
    import {getStories} from '../lib.js';
    import {selectStories} from '../lib.js';
    import {saveStoryline} from '../lib.js';
    import Story from "./Story.svelte";

    let storyline;
    let stories = [];
    let initial = true;
    let disabled = '';

    const getInitStories = async () => {
        let response = await getStories();
        if (response) {
            storyline = response.Storyline;
            stories = response.Stories;
            initial = false;
        }
    }

    const postStorySelection = async (story) => {
        storyline.Stories.push(story);
        let response = await selectStories(storyline);
        if (response) {
            storyline = response.Storyline;
            stories = response.Stories;
        }
    }

    const saveStorySelection = async () => {
        let response = await saveStoryline(storyline);
        if (response) {
            disabled = 'disabled="disabled"';
        }
    }

</script>
{#if initial}
    <h3>Begin storyline selection.</h3>
    <p>This step have to be performed before matching but can be repeated from time to time to keep your matching index in sync with your personal development.</p>
    <button on:click={getInitStories}>Get Stories</button>
{:else}
    <h3>Choose stories to calculate your matching index.</h3>
{/if}

{#if stories.length > 0}
<div>
    <h4>Please select a story that appeals to you by clicking on the text.</h4>
</div>
<ul>
    {#each stories as story}
        <li on:click={postStorySelection(story)}><Story story={story}></Story></li>
    {/each}
</ul>
{:else if !initial && storyline.CompletedMarker == true}
    <h4>Thank you for your selection.</h4>
    <p>Your index is calculated and you can set this selection active by clicking the button.</p>
    <p>This function is usefull as draft / publish option or a possibility to pause and resume your selection.<br>
    The logic for resume would be to check for an existing and not completed storyline for this host entity and call the selection again with this object.</p>
    <button on:click={saveStorySelection} {disabled}>Accept Selection</button>
{/if}

<style>
    ul {
        list-style: none;
    }

    li {
        border: 1px solid #ccc;
        box-shadow: 2px 2px 3px rgba(0,0,0, 0.2);
        margin-bottom: 1rem;
        padding: 1rem;
        cursor: pointer;
    }

    li:hover {
        box-shadow: 1px 1px 4px rgba(0,0,0, 0.4);
    }
</style>