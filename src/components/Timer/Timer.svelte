<script>
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { tweened } from "svelte/motion";
  import { isComplete, isActive } from "../utils/stores";
  export let timeLimit;

  let isTimerActive;
  isActive.subscribe((val) => {
    isTimerActive = val;
  });

  let timer = tweened(timeLimit);
  setInterval(() => {
    if (isTimerActive) {
      if ($timer > 0) $timer--;
      else {
        isComplete.set(true);
        isActive.set(false);
      }
    }
  }, 1000);

  $: minutes = Math.floor($timer / 60);
  $: minname = minutes > 1 ? "mins" : "min";
  $: seconds = Math.floor($timer - minutes * 60);
</script>

<div class="timer-item">
  <span class="mins">{minutes}</span>
  {minname}
  <span class="secs">{seconds}</span>
  s
</div>
<div class="timer-item">
  <progress value={$timer / timeLimit} />
</div>
