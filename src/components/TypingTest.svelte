<script>
  //TODO: Add restart button once test is complete and results are displayed
  import { Circle2 } from "svelte-loading-spinners";
  import Timer from "./Timer/Timer.svelte";
  import TestForm from "./Test/TestForm.svelte";
  import Header from "./Header/Header.svelte";
  import Footer from "./Footer/Footer.svelte";
  import ErrorMessage from "./Error/ErrorMessage.svelte";
  import Results from "../components/Test/Results.svelte";
  import * as Styles from "../colors";
  import { beforeUpdate } from "svelte";

  const timeLimit = 120;
  const numWords = 60;
  const apiUrl = `https://gimme-words.herokuapp.com/word?n=${numWords}`;
  let wordsMapped;

  async function reset() {
    isTimerActive = false;
    isTimerComplete = false;
    testStarted = true;
    gameStats.numWords = 0;
    gameStats.correctWords = 0;
    //TODO: get new words
  }

  async function fetchAndMapWords() {
    const res = await fetch(apiUrl);
    const words = await res.json();
    const mapped = words.map((word) => {
      return {
        word: word,
        isCorrect: null,
        isActive: false,
      };
    });
    mapped[0].isActive = true;
    return mapped;
  }

  //let wordsMapped = fetchAndMapWords(numWords, apiUrl);
  let testStarted = true;
  let isTimerActive = false;
  let isTimerComplete = false;
  let gameStats = {
    numWords: 0,
    correctWords: 0,
  };
</script>

<style>
  .flex-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .help-text {
    text-align: center;
    padding: 2rem;
  }
  .results-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  #reset-button {
    margin-bottom: 2rem;
    text-align: center;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: auto;
    justify-content: center;
    height: 2rem;
    width: 12rem;
    background-color: #4c566a;
    border-radius: 0.4rem;
  }
  #reset-button:hover {
    background-color: #b48ead;
  }
</style>

<div class="flex-container">
  <Header />
  {#if testStarted}
    {#await fetchAndMapWords()}
      <Circle2 size="60" colorInner="#81a1c1" colorOuter="#8fbcbb" unit="px" />
      (Heroku is spinning up the backend and fetching words...)
    {:then wordsMapped}
      {#if !isTimerComplete}
        <section>
          <Timer
            {timeLimit}
            bind:isTimerActive
            bind:isTimerComplete
            bind:testStarted />

          <TestForm
            words={wordsMapped}
            bind:isTimerActive
            bind:isTimerComplete
            bind:gameStats />
        </section>

        <section class="help-text">
          <span>Begin typing to start the test! </span>
          <br />
          <span>Press <strong>Enter</strong> to skip the current word. </span>
        </section>
      {/if}
    {:catch error}
      <ErrorMessage {error} />
    {/await}
  {/if}
  {#if isTimerComplete && !testStarted}
    <section class="results-container">
      <Results bind:gameStats {timeLimit} />
      <div id="reset-button"><span on:click={reset}>Go again</span></div>
    </section>
  {/if}
  <Footer />
</div>
