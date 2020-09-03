<script>
  //TODO: Styspanng
  export let gameStats;
  export let timeLimit;

  $: wpm = ((gameStats.correctWords / timeLimit) * 60).toFixed(1);
</script>

<style>
  section {
    display: flex;
    padding: 2rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  span {
    font-family: monospace;
    font-size: large;
  }
</style>

<section>
  <h2>Results</h2>

  <span>Number of Words: {gameStats.numWords}</span>
  <span>Correct Words: {gameStats.correctWords}</span>
  <span>Word Per Minute: {wpm}</span>
</section>
