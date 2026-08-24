const value = await Promise.resolve('ok')

document.body?.setAttribute('data-ok', value)
