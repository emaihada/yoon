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

    // [오디오 에셋 교체 안내]
    // BGM 및 효과음을 적용하려면 public/assets/ 폴더에 오디오 파일을 업로드하고
    // 아래 주석을 해제하세요. (mp3, wav 등 지원)
    this.load.on('filecomplete-audio-bgm', () => console.log('BGM loaded'));
    this.load.on('loaderror', (file: any) => console.error('Error loading file:', file.src, file.key));

    const baseUrl = import.meta.env.BASE_URL || '/';
    const assetsPath = baseUrl.endsWith('/') ? baseUrl + 'assets/' : baseUrl + '/assets/';
    
    console.log('Loading audio from:', assetsPath);

    this.load.audio('bgm', `${assetsPath}bgm.mp3`);
    this.load.audio('sfx_attack', `${assetsPath}attack.wav`);
    this.load.audio('sfx_hit', `${assetsPath}hit.wav`);
    this.load.audio('sfx_item', `${assetsPath}item.wav`);
    this.load.audio('sfx_level_up', `${assetsPath}level.wav`);
    this.load.audio('sfx_click', `${assetsPath}click1.wav`);
    this.load.audio('sfx_cloth', `${assetsPath}cloth.wav`);
    this.load.audio('sfx_coins', `${assetsPath}Coins.wav`);
    this.load.audio('sfx_footstep', `${assetsPath}footstep.wav`);

    // 현재는 이미지가 없을 경우를 대비해 코드로 임시 픽셀 그래픽을 생성합니다.
    // GameScene에서 텍스처를 생성하므로 여기서는 생성하지 않습니다.
  }

  create() {
    const playerData = this.registry.get('playerData');
    const uid = this.registry.get('uid');
    this.scene.start('GameScene', { userStats: playerData, uid: uid });
  }
}
