const TODO_URL = 'https://jsonplaceholder.typicode.com/todos/1'

function createButton(text: string, onClick: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.addEventListener('click', onClick)
  return button
}

function parseTodo(body: string) {
  const parsed = JSON.parse(body) as { id?: number, title?: string }
  const title = typeof parsed.title === 'string' ? parsed.title : 'untitled'
  const id = typeof parsed.id === 'number' ? parsed.id : 0
  return `#${id} ${title}`
}

export function createWidget() {
  const root = document.createElement('div')
  root.className = 'xhr-resource-userscript'

  const title = document.createElement('h1')
  title.textContent = 'XHR resource userscript'

  const hint = document.createElement('p')
  hint.className = 'meta'
  hint.textContent = GM_getResourceText('hint') || 'hint.json missing'

  const resourceUrl = document.createElement('p')
  resourceUrl.className = 'url'
  resourceUrl.textContent = 'Loading @resource URL…'

  const status = document.createElement('p')
  status.textContent = 'Click Fetch to load a todo over GM.xmlHttpRequest'

  const actions = document.createElement('div')
  actions.className = 'actions'

  const loadResourceUrl = async () => {
    resourceUrl.textContent = await GM.getResourceUrl('hint')
  }

  const fetchTodo = async () => {
    status.textContent = 'Loading...'
    try {
      const response = await GM.xmlHttpRequest({
        method: 'GET',
        url: TODO_URL,
        headers: {
          Accept: 'application/json',
        },
      })
      status.textContent = parseTodo(response.responseText)
    } catch {
      status.textContent = 'Request failed. Check @connect and the host CSP.'
    }
  }

  loadResourceUrl()

  actions.append(createButton('Fetch', () => {
    fetchTodo()
  }))

  root.append(title, hint, resourceUrl, status, actions)

  return root
}
