<script>
  import { afterUpdate, beforeUpdate, onMount } from "svelte";
  import Timer from "../Timer/Timer.svelte";
  import { isActive } from "../utils/stores";
  import Word from "../Words/Word.svelte";

  export let words = [];
</script>

<style>
  #words {
    width: 12em;
    height: 10em;
    overflow: hidden;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
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
