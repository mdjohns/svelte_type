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

  // onMount(() => {
  //   document.getElementById("test_input").focus();
  // });

  const startTimer = () => {
    isActive.update((val) => (val = true));
  };
  const handleInput = (e) => {
    current = words[stats.numWords];
    console.log(current);

    // Check current progress
    if (userInput !== current.word.substr(0, userInput.length)) {
      current.isCorrect = false;
      words[stats.numWords] = { ...current };
    }
    // Reset correct-ness
    else {
      current.isCorrect = null;
      words[stats.numWords] = { ...current };
    }

    //Submit word on "space"
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
        //maybe check timer length and make additional fetch for more words?
      }
      current.isActive = false;
      words[stats.numWords] = { ...current };
      stats.numWords++;
      userInput = "";
    }
    // Skip word on "Enter"
    else if (e.key == "Enter") {
      e.preventDefault();
      current.isActive = false;
      current.isCorrect = false;
      words[stats.numWords] = { ...current };
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
  .typing_input {
    -moz-appearance: textfield;
    -webkit-appearance: textfield;
    background-color: white;
    background-color: -moz-field;
    border: 1px solid #eee;
    box-shadow: 1px 1px 1px 0 lightgray inset;
    font: -moz-field;
    font: -webkit-small-control;
    margin-top: 5px;
    padding: 2px 3px;
    width: 200px;
    height: 100%;
  }
</style>

<DisplayWords {words} />

<!-- <div>
  <input
    type="text"
    id="user_input"
    on:keydown|once={startTimer}
    on:keydown={handleInput}
    autocomplete="false"
    data-lpignore="true" />
</div> -->
<div
  class="typing_input"
  contenteditable="true"
  on:keydown|once={startTimer}
  on:keydown={handleInput}
  bind:innerHTML={userInput} />
