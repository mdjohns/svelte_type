<script>
  import { afterUpdate } from "svelte";
  export let word;
  export let isCorrect;
  export let isActive;
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
  class:active={isActive}
  class:incorrect={isCorrect === false}
  class:correct={isCorrect === true}>
  {word}
</span>
