<script>
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { tweened } from "svelte/motion";

  export let timeLimit;
  export let isTimerActive;
  export let isTimerComplete;
  export let testStarted;

  // let isTimerActive;
  // isActive.subscribe((val) => {
  //   isTimerActive = val;
  // });

  let timer = tweened(timeLimit);
  setInterval(() => {
    if (isTimerActive) {
      if ($timer > 0) $timer--;
      else {
        isTimerActive = false;
        isTimerComplete = true;
        testStarted = false;
      }
    }
  }, 1000);

  $: minutes = Math.floor($timer / 60);
  $: minname = minutes > 1 ? "mins" : "min";
  $: seconds = Math.floor($timer - minutes * 60);
</script>

<style>
  .timer-container {
    text-align: center;
    padding: 1rem;
  }

  span {
    font-family: monospace;
  }
  progress {
    background-color: #3b4252;
    border-radius: 0.4rem;
    border-color: #3b4252;
  }
  progress::-webkit-progress-bar {
    background-color: #3b4252;
    border-color: #3b4252;
  }
  progress::-webkit-progress-value {
    background-color: #8fbcbb;
  }
  progress::-moz-progress-bar {
    background-color: #8fbcbb;
    border-radius: 0.4em;
    border-color: #3b4252;
    /* style rules */
  }
</style>

<div class="timer-container">
  <progress value={$timer / timeLimit} />

  <div>
    <span class="mins">{minutes}</span>
    {minname}
    <span class="secs">{seconds}</span> s
  </div>
</div>
