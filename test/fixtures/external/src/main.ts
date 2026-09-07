import $ from 'fake-jquery'
import { createApp } from 'fake-vue'

document.body?.setAttribute('data-jq', String($))
createApp()
