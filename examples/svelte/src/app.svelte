<script lang="ts">
  let count = $state(0)

  function increment() {
    count += 1
  }

  function decrement() {
    count -= 1
  }

  function reset() {
    count = 0
  };
</script>

<div class="svelte-userscript">
  <h1>Svelte userscript</h1>
  <p>Count: {count}</p>
  <div class="actions">
    <button type="button" onclick={decrement}>-</button>
    <button type="button" onclick={reset}>Reset</button>
    <button type="button" onclick={increment}>+</button>
  </div>
</div>

<style>
  .svelte-userscript {
    border-top: 1px solid black;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
</style>
