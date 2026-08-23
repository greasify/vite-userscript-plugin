const value = await Promise.resolve("tla-ok");

document.body?.setAttribute("data-tla", value);
