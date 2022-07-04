import React from 'react';
import ReactDOM from 'react-dom';
import { media } from 'typestyle';
import { App } from './App';

ReactDOM.render(<App />, document.getElementById('root'));

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
});
