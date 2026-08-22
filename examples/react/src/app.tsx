import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  function increment() {
    setCount(current => current + 1);
  }

  function decrement() {
    setCount(current => current - 1);
  }

  function reset() {
    setCount(0);
  }

  return (
    <div className="react-userscript">
      <h1>React userscript</h1>
      <p>Count: {count}</p>
      <div className="actions">
        <button
          type="button"
          onClick={decrement}
        >
          -
        </button>
        <button
          type="button"
          onClick={reset}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={increment}
        >
          +
        </button>
      </div>
    </div>
  );
}
