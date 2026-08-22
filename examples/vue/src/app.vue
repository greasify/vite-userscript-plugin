<template>
  <div class="vue-userscript">
    <h1>Vue userscript</h1>
    <p>Count: {{ count }}</p>
    <div class="actions">
      <button
        type="button"
        @click="decrement"
      >
        -
      </button>
      <button
        type="button"
        @click="reset"
      >
        Reset
      </button>
      <button
        type="button"
        @click="increment"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const count = ref(0);

function increment() {
  count.value += 1;
}

function decrement() {
  count.value -= 1;
}

function reset() {
  count.value = 0;
}
</script>

<style scoped>
.vue-userscript {
  border-top: 1px solid black;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>
