import Phaser from 'phaser';

// Sem carregamento por CDN: arte provisória é desenhada via Graphics.
export class BootScene extends Phaser.Scene{
  constructor(){super('BootScene');}
  create(){this.scene.start('DungeonScene');}
}
