import { createCounter } from "./counter.js";
import "./style.scss";

if (document.body) {
  document.body.append(createCounter());
}
