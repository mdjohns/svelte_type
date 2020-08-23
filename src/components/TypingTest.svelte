<script>
  import Timer from "./Timer.svelte";
  import DisplayWords from "./DisplayWords.svelte";
  let userInput = "";
  let timerOn = false;
  const testTime = 90;

  // onmount fetch array of words and pass to DisplayWords
  // allow user to select number of words and time limit
  //
</script>

<Timer timeLimit={testTime} isActive={timerOn} />
<DisplayWords />
<input type="text" id="user_input" bind:value={userInput} />
<input type="checkbox" bind:checked={timerOn} />
