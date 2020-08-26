<script>
  import { afterUpdate, beforeUpdate, onMount } from "svelte";
  import App from "../../App.svelte";
  import Timer from "../Timer/Timer.svelte";
  import TypingTest from "../TypingTest.svelte";
  import Word from "../Words/Word.svelte";
  import TestForm from "./TestForm.svelte";

  export let words = [];
</script>

<style>
  #words {
    width: 200px;
    height: 100px;
    overflow: hidden;
    user-select: none;
    -moz-user-select: none;
    -wekbit-user-select: none;
    border: 1px solid black;
    border-radius: 4px;
  }
</style>

<div id="words">
  {#each words as word}
    <Word {...word} />
    <br />
  {/each}
</div>
