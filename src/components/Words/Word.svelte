<script>
  import { afterUpdate, onMount } from "svelte";
  export let word;
  export let isCorrect;
  export let isActive;

  let wordElement;
  afterUpdate(() => {
    isActive ? wordElement.scrollIntoView(false) : "";
  });
</script>

<style>
  span {
    color: #000;
    font-family: serif;
  }
  .active {
    background: #dddddd;
  }
  .incorrect {
    color: darkred;
  }
  .correct {
    color: green;
  }
</style>

<span
  bind:this={wordElement}
  class:active={isActive}
  class:incorrect={isCorrect === false}
  class:correct={isCorrect === true}>
  {word}
</span>
