<script>
  export let words = [];
  export let userInputProps;
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

  .word {
    color: #000;
    font-family: serif;
  }
  .active-word {
    background: #dddddd;
  }
  .correct {
    color: green;
  }

  .incorrect {
    color: darkred;
  }
</style>

<div id="words">
  {#each words as word, i}
    {#if words[i].isActive}
      <span class="word active-word">{word.word}</span>
    {:else if words[i].isCorrect}
      <span class="word correct">{word.word}</span>
    {:else if words[i].isCorrect === false}
      <span class="word incorrect">{word.word}</span>
    {:else}
      <span class="word">{word.word}</span>
    {/if}
    <br />
  {/each}
</div>
