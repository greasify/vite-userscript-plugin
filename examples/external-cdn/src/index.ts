import $ from 'jquery'
import { createWidget } from './widget'
import './style.css'

if (document.body) {
  $('body')
    .attr('data-cdn-jquery', $.fn.jquery)
    .append(createWidget())
}
