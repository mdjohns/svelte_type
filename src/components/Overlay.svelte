<script>
  let timeLimit;
  let styleToggle = "";
  const toggleOverlay = () => {
    if (styleToggle !== "") {
      styleToggle = "width: 0";
    }
  };
</script>

<style>
  .overlay {
    height: 100%;
    width: 100%;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.9);
    overflow-x: hidden;
    transition: 0.5s;
  }

  .overlay-content {
    position: relative;
    top: 25%;
    width: 100%;
    text-align: center;
    margin-top: 30px;
    color: #818181;
  }

  @media screen and (max-height: 450px) {
    .overlay a {
      font-size: 20px;
    }
    .overlay .closebtn {
      font-size: 40px;
      top: 15px;
      right: 35px;
    }
  }
</style>

<div class="overlay" style="styleToggle">
  <div class="overlay-content">
    <h1>Svelte Type</h1>
    <label>
      <input
        type="number"
        bind:value={timeLimit}
        min="1"
        max="5"
        placeholder="Time Limit (minutes)" />
    </label>
    <button on:click={toggleOverlay}>Start</button>
  </div>
</div>
