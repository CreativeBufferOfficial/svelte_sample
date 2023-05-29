<script>
    export let host;
    console.log(host);
</script>

<div>
    <h5>{host.HostEntityType} {host.HostEntityId}</h5>
    <p>Matching: {host.Match}</p>
</div>