import { createApp } from "vue";

import App from "./app.vue";

if (document.body) {
  const root = document.createElement("div");
  document.body.append(root);
  createApp(App).mount(root);
}
