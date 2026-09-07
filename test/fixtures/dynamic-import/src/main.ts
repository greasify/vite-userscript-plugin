const { label } = await import('./lazy')

document.body?.setAttribute('data-dynamic', label)
