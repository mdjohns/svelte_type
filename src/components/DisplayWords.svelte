<script>
  export let words;

  // need to divide words into even rows
  // style active row to be more visible
</script>

<style>
  #words {
    width: 400px;
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
    <span>{word}</span>
  {/each}
</div>
