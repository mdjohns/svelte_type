<script>
  //TODO: Add restart button once test is complete and results are displayed
  import { onMount } from "svelte";
  import Timer from "./Timer/Timer.svelte";
  import TestForm from "./Test/TestForm.svelte";
  import Header from "./Header/Header.svelte";
  import Results from "../components/Test/Results.svelte";
  import * as Styles from "../styles";

  const timeLimit = 30;
  const numWords = 50;
  const apiUrl = `https://random-word-api.herokuapp.com/word?number=${numWords}`;

  //TEST DATA
  import words from "./utils/testApiData";

  //let words = [];
  let wordObjArr;
  let isTimerActive = false;
  let isTimerComplete = false;
  let gameStats = {
    numWords: 0,
    correctWords: 0,
  };

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
  .flex-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #eceff4;
  }
</style>

<div class="flex-container">
  <Header />
  {#if !isTimerComplete}
    <section>
      <Timer {timeLimit} bind:isTimerActive bind:isTimerComplete />
      <TestForm
        words={wordObjArr}
        bind:isTimerActive
        bind:isTimerComplete
        bind:gameStats />
    </section>

    <section id="help-text">
      <span>Begin typing to start the test! </span>
      <br />
      <span>Press <strong>Enter</strong> to skip the current word. </span>
    </section>
  {/if}

  {#if isTimerComplete}
    <Results bind:gameStats {timeLimit} />
  {/if}
</div>
