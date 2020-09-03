<script>
  import Word from "./Word.svelte";
  export let words = [];
</script>

<style>
  #words {
    display: block;
    padding: 1.4rem;
    overflow: hidden;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    font-size: x-large;
  }
</style>

<div id="words">
  {#each words as word, i}
    <Word {...word} />
    <!-- {#if i !== 0 && i % 4 === 0}<br />{/if} -->
  {/each}
</div>
