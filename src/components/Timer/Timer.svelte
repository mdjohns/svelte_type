<script>
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { tweened } from "svelte/motion";

  export let timeLimit;
  export let isTimerActive;
  export let isTimerComplete;

  // let isTimerActive;
  // isActive.subscribe((val) => {
  //   isTimerActive = val;
  // });

  let timer = tweened(timeLimit);
  setInterval(() => {
    if (isTimerActive) {
      if ($timer > 0) $timer--;
      else {
        // isComplete.set(true);
        // isActive.set(false);
        isTimerActive = false;
        isTimerComplete = true;
      }
    }
  }, 1000);

  $: minutes = Math.floor($timer / 60);
  $: minname = minutes > 1 ? "mins" : "min";
  $: seconds = Math.floor($timer - minutes * 60);
</script>

<style>
  progress {
    background-color: #3b4252;
  }
  progress::-webkit-progress-bar {
    background-color: #3b4252;
    border-radius: 7px;
  }
  progress::-webkit-progress-value {
    background-color: #88c0d0;
  }
  progress::-moz-progress-bar {
    background-color: #88c0d0;
    /* style rules */
  }
</style>

<progress value={$timer / timeLimit} />

<div>
  <span class="mins">{minutes}</span>
  {minname}
  <span class="secs">{seconds}</span> s
</div>
