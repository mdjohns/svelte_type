<script>
  import { onMount, afterUpdate } from "svelte";
  import DisplayWords from "./DisplayWords.svelte";
  import { isActive } from "../utils/stores";
  export let words;
  let userInput = "";
  let current = "";

  let stats = {
    numWords: 0,
    correct: 0,
  };

  const startTimer = () => {
    isActive.update((val) => (val = true));
  };
  const keyHandler = (e) => {
    current = words[stats.numWords];
    console.log(current);
    if (e.key == " ") {
      e.preventDefault();
      if (userInput === current.word) {
        current.isCorrect = true;
        stats.correct++;
      } else {
        current.isCorrect = false;
      }
      if (stats.numWords !== words.length) {
        words[stats.numWords + 1].isActive = true;
        //TODO: handle case where we run out of words before end of timer
      }
      stats.numWords++;
      userInput = "";
      current.isActive = false;
    } else if (e.key == "Enter") {
      e.preventDefault();
      current.isActive = false;
      current.isCorrect = false;
      userInput = "";
      stats.numWords++;
      if (stats.numWords !== words.length) {
        words[stats.numWords].isActive = true;
        //TODO: handle case where we run out of words before end of timer
      }
    }
  };
</script>

<style>
  #user_input {
    width: 200px;
  }
</style>

<DisplayWords {words} />

<div>
  <input
    type="text"
    id="user_input"
    on:keydown|once={startTimer}
    on:keydown={keyHandler}
    bind:value={userInput}
    autocomplete="false"
    data-lpignore="true" />
</div>
