<script>
  import Word from "./Word.svelte";
  export let words = [];
</script>

<style>
  #words {
    width: 80vw;
    height: 40vh;
    overflow: hidden;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    font-size: x-large;
  }
</style>

<div id="words">
  {#each words as word}
    <Word {...word} />
    <br />
  {/each}
</div>
