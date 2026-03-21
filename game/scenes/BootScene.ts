import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // [그래픽 에셋 교체 안내]
    // 아래 주석 처리된 코드를 해제하고 실제 이미지 경로를 입력하면 이미지가 적용됩니다.
    // public/assets/ 폴더에 이미지 파일을 넣어주세요.
    // this.load.image('player', '/assets/player.png');
    // this.load.image('monster', '/assets/monster.png');
    // this.load.image('item', '/assets/item.png');
    // this.load.image('wall', '/assets/wall.png');
    // this.load.image('grass', '/assets/grass.png');

    // 현재는 이미지가 없을 경우를 대비해 코드로 임시 픽셀 그래픽을 생성합니다.
    // GameScene에서 텍스처를 생성하므로 여기서는 생성하지 않습니다.
  }

  create() {
    const playerData = this.registry.get('playerData');
    const uid = this.registry.get('uid');
    this.scene.start('GameScene', { userStats: playerData, uid: uid });
  }
}
