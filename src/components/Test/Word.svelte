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
    color: #eceff4;
    font-family: monospace;
  }
  .active {
    color: #b48ead;
    font-weight: bold;
  }
  .incorrect-active {
    background: #bf616a;
    color: white;
  }
  .incorrect {
    color: #bf616a;
  }
  .correct {
    color: #a3be8c;
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
