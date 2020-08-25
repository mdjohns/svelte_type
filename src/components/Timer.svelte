<script>
  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { tweened } from "svelte/motion";
  export let timeLimit;
  export let isActive;

  let timer = tweened(timeLimit);
  setInterval(() => {
    if (isActive) {
      if ($timer > 0) $timer--;
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
