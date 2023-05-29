<script>
	import {onMount} from 'svelte';
	import * as lib from './lib.js';
	import GetStories from "./components/GetStories.svelte";
	import CreateHost from "./components/CreateHost.svelte";
	import DeleteHost from "./components/DeleteHost.svelte";
	import GetStoryline from "./components/GetStoryline.svelte";
	import GetMatching from "./components/GetMatching.svelte";
	import HostList from "./components/HostList.svelte";
	import GetReport from "./components/GetReport.svelte";

	onMount(async () => {
		lib.login();
	});

</script>

<main>
	<h1>Storymatcher</h1>
	<h2>API Test</h2>
	<p>All data objects are logged at the browser debug console.</p>

	<details>
		<summary>Set current storyline host.</summary>
		<div class="detailsWrapper">
		<HostList></HostList>
		</div>
	</details>
	<details>
		<summary>Create a host entity</summary>
		<div class="detailsWrapper">
			<CreateHost></CreateHost>
		</div>
	</details>
	<details>
		<summary>Set storyline</summary>
		<div class="detailsWrapper">
			<GetStories></GetStories>
		</div>
	</details>
	<details>
		<summary>Get current storyline</summary>
		<div class="detailsWrapper">
			<GetStoryline></GetStoryline>
		</div>
	</details>
	<details>
		<summary>Get current report</summary>
		<div class="detailsWrapper">
			<GetReport></GetReport>
		</div>
	</details>

	<details>
		<summary>Get matching for current host</summary>
		<GetMatching></GetMatching>
	</details>
	<details>
		<summary>Delete host entity</summary>
		<DeleteHost></DeleteHost>
	</details>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4rem;
		font-weight: 100;
	}

	h2 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2.45rem;
		font-weight: 100;
	}


	details {
		margin-bottom: 2rem;
	}

	details summary{
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		text-transform: uppercase;
		border: 3px solid #4741bf;
		color: #333;
		margin-bottom: 0;
		cursor: pointer;
	}

	.detailsWrapper {
		padding: 1rem;
		border-left: 1px solid #ccc;
		border-right: 1px solid #ccc;
		border-bottom: 1px solid #ccc;
	}


</style>