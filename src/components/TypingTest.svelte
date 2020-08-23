<script>
  import { onMount } from "svelte";
  import Timer from "./Timer.svelte";
  import Toggle from "./Toggle.svelte";
  import Overlay from "./Overlay.svelte";
  import DisplayWords from "./DisplayWords.svelte";
  let userInput = "";
  let isActive = false;
  const timeLimit = 90;
  const apiUrl = "https://random-word-api.herokuapp.com/word?number=50";
  let words = [];

  const toggle = () => {
    isActive = !isActive;
  };
  //   onMount(async () => {
  //     const res = await fetch(apiUrl);
  //     words = await res.json();
  //   });
</script>

<Timer {timeLimit} {isActive} />
<DisplayWords {words} />
<input type="text" id="user_input" bind:value={userInput} />
<button on:click={toggle}>Toggle</button>
<Overlay />
