import './style.css';
import { Engine } from './engine/Engine';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (container) {
    const engine = new Engine(container);
    (window as unknown as { __engine: Engine }).__engine = engine;
    console.log('Sealbound Tactical Engine Initialized Successfully.');
  }
});
