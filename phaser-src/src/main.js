import Phaser from 'phaser';
import {BootScene} from './scenes/BootScene.js';
import {DungeonScene} from './scenes/DungeonScene.js';
import './style.css';
import {initPreviewPwa} from './preview-pwa.js';

// Sem alterações na rota principal, SW ou localStorage.
// No P2A Phaser apresenta o mapa; os turnos não são executados pelo render.
initPreviewPwa();
const game=new Phaser.Game({
  type:Phaser.AUTO,
  parent:'phaser-canvas',
  width:900,
  height:600,
  backgroundColor:'#0b0c11',
  render:{pixelArt:true,antialias:false},
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[BootScene,DungeonScene]
});
window.addEventListener('pagehide',()=>game.destroy(true),{once:true});
