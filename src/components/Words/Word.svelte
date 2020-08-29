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
  .incorrect-active {
    background: red;
    color: white;
  }
  .incorrect {
    color: red;
  }
  .correct {
    color: green;
  }
</style>

<span
  bind:this={wordElement}
  class:active={isActive}
  class:incorrect-active={isActive && isCorrect === false}
  class:incorrect={!isActive && isCorrect === false}
  class:correct={!isActive && isCorrect === true}>
  {word}
</span>
