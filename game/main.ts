import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { User } from 'firebase/auth';

export const initGame = (parent: HTMLElement, user: User | null, playerData: any) => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parent,
    width: '100%',
    height: '100%',
    pixelArt: true, // Retro 16-bit style
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0, x: 0 },
        debug: false
      }
    },
    scene: [BootScene, GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
      disableWebAudio: false,
      noAudio: false
    }
  };

  const game = new Phaser.Game(config);
  
  // Pass user data to scenes if needed
  game.registry.set('user', user);
  game.registry.set('playerData', playerData);
  game.registry.set('uid', user?.uid);

  return game;
};

export const destroyGame = (game: Phaser.Game) => {
  game.destroy(true);
};
