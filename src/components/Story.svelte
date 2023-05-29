<script>
    export let story;
    console.log(story);

    let summary = story.Summary != '' ? story.Summary : story.Text.replace(/(<([^>]+)>)/gi, "").substring(0, 200) + '[...]';
</script>

<h3>{story.Title}</h3>
<div>
    <h5>Summary:</h5>
    {@html summary}
</div>
<div>
    <h5>Text:</h5>
    {@html story.Text}
</div>