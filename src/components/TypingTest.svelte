<script>
  //TODO: If isComplete, display Results
  import { onMount } from "svelte";
  import { isActive, isComplete } from "./utils/stores";
  import Timer from "./Timer/Timer.svelte";
  import TestForm from "./Words/TestForm.svelte";
  import Header from "./Header/Header.svelte";

  //TEST DATA
  import words from "./utils/testApiData";

  let isActive_value;
  const timerActiveUnsubscribe = isActive.subscribe(
    (val) => (isActive_value = val)
  );
  let isComplete_value;
  const timerCompleteUnsubscribe = isComplete.subscribe(
    (val) => (isComplete_value = val)
  );

  const timeLimit = 90;
  const numWords = 50;
  const apiUrl = `https://random-word-api.herokuapp.com/word?number=${numWords}`;
  //let words = [];
  let wordObjArr;
  // onMount(async () => {
  //   const res = await fetch(apiUrl);
  //   words = await res.json();
  // });

  onMount(() => {
    //TODO: move this to async onMount with fetch
    wordObjArr = words.map((word) => {
      return {
        word: word,
        isCorrect: null,
        isActive: false,
      };
    });
    wordObjArr[0].isActive = true;
  });
</script>

<style>
  #test {
    height: 100%;
    padding: 0;
    margin: 0;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>

<Header />
<div id="test">
  <Timer {timeLimit} />
  <TestForm words={wordObjArr} />

  <div>Begin typing to start the test!</div>

  <div id="help_text">
    <p>
      Press
      <strong>Enter</strong>
      to skip the current word.
    </p>
  </div>
</div>
