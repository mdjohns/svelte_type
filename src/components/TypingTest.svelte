<script>
  import { onMount } from "svelte";
  import Timer from "./Timer.svelte";
  import Toggle from "./Toggle.svelte";
  import Overlay from "./Overlay.svelte";
  import DisplayWords from "./DisplayWords.svelte";
  import words from "./testApiData";
  let userInput = "";
  let isActive = false;
  const timeLimit = 90;

  const numWords = 50;
  const apiUrl = `https://random-word-api.herokuapp.com/word?number=${numWords}`;
  //let words = [];

  const toggle = () => {
    isActive = !isActive;
  };
  // onMount(async () => {
  //   const res = await fetch(apiUrl);
  //   words = await res.json();
  // });
</script>

<style>
  #test {
    height: 100%;
    padding: 0;
    margin: 0;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>

<div id="test">
  <h1>Typing Test</h1>
  <Timer {timeLimit} {isActive} />
  <DisplayWords {words} />
  <input type="text" id="user_input" bind:value={userInput} />

  {#if isActive === false}
    <button on:click={toggle}>Start Test</button>
  {/if}
</div>
