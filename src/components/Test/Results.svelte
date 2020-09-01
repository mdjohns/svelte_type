<script>
  //TODO: Styling
  export let gameStats;
  export let timeLimit;

  $: wpm = (gameStats.correctWords / timeLimit) * 60;
</script>

<section>
  <h2>Results</h2>
  <ul>
    <li>Number of Words: {gameStats.numWords}</li>
    <li>Correct Words: {gameStats.correctWords}</li>
    <li>Word Per Minute: {wpm}</li>
  </ul>
</section>
