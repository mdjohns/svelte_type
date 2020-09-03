<script>
  import { onMount, afterUpdate } from "svelte";
  import DisplayWords from "./DisplayWords.svelte";

  export let words;
  export let isTimerActive;
  export let gameStats;

  let userInput = "";
  let inputElement;
  let current = "";

  onMount(() => {
    inputElement.focus();
  });
  const startTimer = () => {
    isTimerActive = true;
  };
  const handleInput = (e) => {
    //TODO: Can this be refactored? A lot going on here
    current = words[gameStats.numWords];
    // Check current progress
    if (userInput !== current.word.substr(0, userInput.length)) {
      current.isCorrect = false;
      words[gameStats.numWords] = { ...current };
    }
    // Reset correct-ness
    else {
      current.isCorrect = null;
      words[gameStats.numWords] = { ...current };
    }

    //Submit word on "space"
    if (e.key == " ") {
      e.preventDefault();
      if (userInput === current.word) {
        current.isCorrect = true;
        gameStats.correctWords++;
      } else {
        current.isCorrect = false;
      }
      if (gameStats.numWords !== words.length) {
        words[gameStats.numWords + 1].isActive = true;
        //TODO: handle case where we run out of words before end of timer
        //maybe check timer length and make additional fetch for more words?
      }
      current.isActive = false;
      words[gameStats.numWords] = { ...current };
      gameStats.numWords++;
      userInput = "";
    }
    // Skip word on "Enter"
    else if (e.key == "Enter") {
      e.preventDefault();
      current.isActive = false;
      current.isCorrect = false;
      words[gameStats.numWords] = { ...current };
      userInput = "";
      gameStats.numWords++;
      if (gameStats.numWords !== words.length) {
        words[gameStats.numWords].isActive = true;
        //TODO: handle case where we run out of words before end of timer
      }
    }
  };
</script>

<style>
  .container {
    flex-grow: 2;
    background-color: #3b4252;
    max-width: 40rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 0.4rem;
  }
  .typing-input {
    background-color: #4c566a;
    color: #eceff4;
    font-family: monospace;
    font-size: large;
    width: 50%;
    border: none;
  }
</style>

<div class="container">
  <DisplayWords {words} />

  <input
    class="typing-input"
    bind:this={inputElement}
    bind:value={userInput}
    on:keydown|once={startTimer}
    on:keydown={handleInput} />
</div>
