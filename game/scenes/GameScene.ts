import Phaser from 'phaser';
import { rtdb } from '../../services/firebase';
import { ref, onValue, set, onDisconnect, remove, off } from 'firebase/database';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private monsters!: Phaser.Physics.Arcade.Group;
  private items!: Phaser.Physics.Arcade.Group;
  private targetPosition: Phaser.Math.Vector2 | null = null;
  private targetMonster: Phaser.Physics.Arcade.Sprite | null = null;
  private lastAttackTime = 0;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private playerStats: any;
  private uid!: string;
  private lastDamageTime = 0;
  private lastFootstepTime = 0;
  private nameTag!: Phaser.GameObjects.Text;
  private guildTag!: Phaser.GameObjects.Text;
  private speed = 150;
  private fog!: Phaser.GameObjects.Graphics;
  private isFoggy = false;
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapBg!: Phaser.GameObjects.Graphics;
  private minimapPlayerMarker!: Phaser.GameObjects.Graphics;
  private minimapMonsters!: Phaser.GameObjects.Graphics;
  private minimapCamera!: Phaser.Cameras.Scene2D.Camera;
  private bossRespawnTimer: Phaser.Time.TimerEvent | null = null;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private npcNameTag!: Phaser.GameObjects.Text;
  private blacksmith!: Phaser.Physics.Arcade.Sprite;
  private blacksmithTag!: Phaser.GameObjects.Text;
  private shopkeeper!: Phaser.Physics.Arcade.Sprite;
  private shopkeeperTag!: Phaser.GameObjects.Text;
  private mage!: Phaser.Physics.Arcade.Sprite;
  private mageTag!: Phaser.GameObjects.Text;
  private hunter!: Phaser.Physics.Arcade.Sprite;
  private hunterTag!: Phaser.GameObjects.Text;
  private questNpc!: Phaser.Physics.Arcade.Sprite;
  private questNpcTag!: Phaser.GameObjects.Text;
  private innNpc!: Phaser.Physics.Arcade.Sprite;
  private innNpcTag!: Phaser.GameObjects.Text;
  private ghostNpc!: Phaser.Physics.Arcade.Sprite;
  private ghostNameTag!: Phaser.GameObjects.Text;
  private fireballs!: Phaser.Physics.Arcade.Group;
  private lastBossFireTime: number = 0;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private bossNameTag!: Phaser.GameObjects.Text;
  private bossHpBar!: Phaser.GameObjects.Graphics;
  private isDead = false;
  private grid: number[][] = [];
  private mapWidth = 50;
  private mapHeight = 50;
  private tileSize = 32;
  private otherPlayerSprites: { [uid: string]: Phaser.GameObjects.Container } = {};
  private lastSyncTime = 0;
  private lastSyncX = 0;
  private lastSyncY = 0;
  private playersRef: any;
  private monstersRef: any;
  private syncedMonsters: { [id: string]: Phaser.Physics.Arcade.Sprite } = {};

  constructor() {
    super('GameScene');
  }

  init(data: { userStats: any, uid: string }) {
    this.playerStats = data.userStats || { 
      hp: 100, maxHp: 100, 
      mp: 50, maxMp: 50,
      exp: 0, maxExp: 100, 
      level: 1, atk: 10, def: 10, gold: 0 
    };
    if (this.playerStats.mp === undefined) {
      this.playerStats.mp = 50;
      this.playerStats.maxMp = 50;
    }
    this.uid = data.uid;
    
    // Ensure x, y exist. Default to town center (25 * 32 = 800)
    this.playerStats.x = 800;
    this.playerStats.y = 800;
  }

  playSound(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, config);
    }
  }

  preload() {
    // Generate simple pixel textures
    const g = this.add.graphics();
    
    // Grass (Detailed)
    g.fillStyle(0x3a5a2a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a6a3a);
    g.fillRect(2, 2, 4, 4);
    g.fillRect(18, 10, 4, 4);
    g.fillRect(8, 22, 4, 4);
    g.fillStyle(0x2a4a1a);
    g.fillRect(26, 26, 4, 4);
    g.generateTexture('grass', 32, 32);
    g.clear();

    // Town Floor (Detailed)
    g.fillStyle(0x8a8a8a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x7a7a7a);
    g.fillRect(0, 0, 15, 15);
    g.fillRect(17, 17, 15, 15);
    g.fillStyle(0x6a6a6a);
    g.fillRect(17, 0, 15, 15);
    g.fillRect(0, 17, 15, 15);
    g.generateTexture('town_floor', 32, 32);
    g.clear();

    // Wall (Detailed Brick)
    g.fillStyle(0x5a3a2a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a2a1a);
    g.fillRect(0, 0, 32, 15);
    g.fillRect(0, 17, 15, 15);
    g.fillRect(17, 17, 15, 15);
    g.generateTexture('wall', 32, 32);
    g.clear();

    // Building Roof
    g.fillStyle(0x8b0000);
    g.fillRect(0, 0, 96, 64);
    g.fillStyle(0x6b0000);
    g.fillTriangle(0, 64, 48, 0, 96, 64);
    g.generateTexture('building', 96, 64);
    g.clear();

    // Player Base (Detailed)
    g.fillStyle(0xffccaa); // Skin
    g.fillRect(6, 2, 12, 10);
    g.fillStyle(0x000000); // Eyes
    g.fillRect(8, 6, 2, 2);
    g.fillRect(14, 6, 2, 2);
    g.fillStyle(0x333333); // Hair
    g.fillRect(6, 0, 12, 4);
    g.fillStyle(0x4444ff); // Body
    g.fillRect(4, 12, 16, 10);
    g.fillStyle(0x222222); // Feet
    g.fillRect(4, 22, 6, 2);
    g.fillRect(14, 22, 6, 2);
    g.generateTexture('player', 24, 24);
    g.clear();

    // Slime (Detailed)
    g.fillStyle(0x00ffaa, 0.8);
    g.fillRoundedRect(2, 8, 20, 16, 8);
    g.fillStyle(0xffffff);
    g.fillRect(6, 12, 4, 4);
    g.fillRect(14, 12, 4, 4);
    g.fillStyle(0x000000);
    g.fillRect(8, 14, 2, 2);
    g.fillRect(16, 14, 2, 2);
    g.generateTexture('slime', 24, 24);
    g.clear();

    // Goblin (Detailed)
    g.fillStyle(0x55aa00);
    g.fillRect(4, 4, 16, 12);
    g.fillStyle(0xff0000);
    g.fillRect(6, 8, 4, 2);
    g.fillRect(14, 8, 4, 2);
    g.fillStyle(0x8b4513); // Loincloth
    g.fillRect(6, 16, 12, 8);
    g.generateTexture('goblin', 24, 24);
    g.clear();

    // Orc (Detailed)
    g.fillStyle(0xaa5500);
    g.fillRect(4, 2, 24, 16);
    g.fillStyle(0xffffff); // Tusks
    g.fillRect(8, 14, 2, 4);
    g.fillRect(22, 14, 2, 4);
    g.fillStyle(0x333333); // Armor
    g.fillRect(2, 18, 28, 14);
    g.generateTexture('orc', 32, 32);
    g.clear();

    // Dragon (Detailed)
    g.fillStyle(0xaa0000);
    g.fillRoundedRect(8, 8, 32, 32, 8);
    g.fillStyle(0xffff00); // Eyes
    g.fillRect(12, 16, 6, 4);
    g.fillRect(30, 16, 6, 4);
    g.fillStyle(0xff8800); // Wings
    g.fillTriangle(0, 24, 8, 8, 8, 40);
    g.fillTriangle(48, 24, 40, 8, 40, 40);
    g.generateTexture('dragon', 48, 48);
    g.clear();

    // Ghost (Detailed)
    g.fillStyle(0xaaaaaa, 0.6);
    g.fillRoundedRect(4, 4, 16, 20, 8);
    g.fillStyle(0xffffff);
    g.fillCircle(8, 10, 2);
    g.fillCircle(16, 10, 2);
    g.generateTexture('ghost', 24, 24);
    g.clear();

    // Wolf (Detailed)
    g.fillStyle(0x666666);
    g.fillRect(4, 8, 16, 12); // Body
    g.fillRect(16, 4, 8, 8); // Head
    g.fillStyle(0x444444);
    g.fillRect(4, 20, 4, 4); // Leg
    g.fillRect(16, 20, 4, 4); // Leg
    g.fillStyle(0xff0000);
    g.fillRect(18, 6, 2, 2); // Eye
    g.generateTexture('wolf', 24, 24);
    g.clear();

    // Tree (Transparent background)
    g.fillStyle(0x8b4513);
    g.fillRect(12, 20, 8, 12); // Trunk
    g.fillStyle(0x228b22);
    g.fillCircle(16, 12, 12); // Leaves
    g.generateTexture('tree', 32, 32);
    g.clear();

    // Stone (Rock/Boulder look)
    g.fillStyle(0x666666);
    g.fillEllipse(16, 18, 14, 10); // Main rock body
    g.fillStyle(0x888888);
    g.fillEllipse(12, 14, 6, 4); // Highlight
    g.fillStyle(0x444444);
    g.fillEllipse(20, 22, 6, 4); // Shadow
    g.generateTexture('stone', 32, 32);
    g.clear();

    // NPCs
    g.fillStyle(0xffccaa); // Skin
    g.fillRect(6, 2, 12, 10);
    g.fillStyle(0x000000); // Eyes
    g.fillRect(8, 6, 2, 2);
    g.fillRect(14, 6, 2, 2);
    g.fillStyle(0xaaaaaa); // Hair/Beard
    g.fillRect(6, 0, 12, 4);
    g.fillRect(6, 10, 12, 4);
    g.fillStyle(0x880088); // Robe
    g.fillRect(4, 12, 16, 12);
    g.generateTexture('npc_chief', 24, 24);
    g.clear();

    g.fillStyle(0xffccaa); g.fillRect(6, 2, 12, 10);
    g.fillStyle(0x000000); g.fillRect(8, 6, 2, 2); g.fillRect(14, 6, 2, 2);
    g.fillStyle(0x444444); g.fillRect(4, 12, 16, 12); // Apron
    g.fillStyle(0x888888); g.fillRect(16, 14, 8, 4); // Hammer
    g.generateTexture('npc_blacksmith', 24, 24);
    g.clear();

    g.fillStyle(0xffccaa); g.fillRect(6, 2, 12, 10);
    g.fillStyle(0x000000); g.fillRect(8, 6, 2, 2); g.fillRect(14, 6, 2, 2);
    g.fillStyle(0x008800); g.fillRect(4, 12, 16, 12); // Green clothes
    g.fillStyle(0xffff00); g.fillCircle(12, 18, 4); // Coin
    g.generateTexture('npc_shop', 24, 24);
    g.clear();

    // Items
    // Slime Jelly
    g.fillStyle(0x00ffaa, 0.7); g.fillCircle(8, 10, 6); 
    g.fillStyle(0xffffff, 0.5); g.fillCircle(6, 8, 2);
    g.generateTexture('item_slime_jelly', 16, 16); g.clear();
    
    // Wolf Fur
    g.fillStyle(0x888888); g.fillRect(2, 4, 12, 8);
    g.fillStyle(0x666666); g.fillRect(4, 2, 2, 4); g.fillRect(10, 2, 2, 4);
    g.generateTexture('item_wolf_fur', 16, 16); g.clear();

    // Goblin Ear
    g.fillStyle(0x55aa00); g.fillTriangle(4, 4, 12, 8, 4, 12);
    g.generateTexture('item_goblin_ear', 16, 16); g.clear();
    
    // Orc Tooth
    g.fillStyle(0xeeeeee); g.fillTriangle(4, 12, 8, 2, 12, 12);
    g.generateTexture('item_orc_tooth', 16, 16); g.clear();
    
    // Ectoplasm
    g.fillStyle(0xaaaaff, 0.4); g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(6, 6, 2);
    g.generateTexture('item_ectoplasm', 16, 16); g.clear();

    // Dragon Heart
    g.fillStyle(0xff0000); g.fillCircle(8, 8, 7);
    g.fillStyle(0x880000); g.fillCircle(8, 8, 4);
    g.generateTexture('item_dragon_heart', 16, 16); g.clear();
    
    // Red Potion
    g.fillStyle(0xaaaaaa); g.fillRect(6, 2, 4, 4); // Neck
    g.fillStyle(0xffffff); g.fillRect(5, 1, 6, 2); // Cork
    g.fillStyle(0xff0000); g.fillCircle(8, 10, 6); // Body
    g.fillStyle(0xff8888); g.fillCircle(6, 8, 2); // Highlight
    g.generateTexture('item_potion', 16, 16); g.clear();

    // Blue Potion
    g.fillStyle(0xaaaaaa); g.fillRect(6, 2, 4, 4);
    g.fillStyle(0xffffff); g.fillRect(5, 1, 6, 2);
    g.fillStyle(0x0000ff); g.fillCircle(8, 10, 6);
    g.fillStyle(0x8888ff); g.fillCircle(6, 8, 2);
    g.generateTexture('item_potion_blue', 16, 16); g.clear();

    // Experience Potion (Purple)
    g.fillStyle(0xaaaaaa); g.fillRect(6, 2, 4, 4);
    g.fillStyle(0xffffff); g.fillRect(5, 1, 6, 2);
    g.fillStyle(0xaa00ff); g.fillCircle(8, 10, 6);
    g.fillStyle(0xff88ff); g.fillCircle(6, 8, 2);
    g.generateTexture('item_potion_exp', 16, 16); g.clear();

    // Weapon Graphics
    // Sickle
    g.fillStyle(0x888888); g.fillRect(7, 8, 2, 8); // Handle
    g.fillStyle(0xcccccc); g.fillTriangle(7, 8, 14, 4, 7, 0); // Blade
    g.generateTexture('weapon_sickle', 16, 16); g.clear();

    // Mace
    g.fillStyle(0x8b4513); g.fillRect(7, 8, 2, 8); // Handle
    g.fillStyle(0x666666); g.fillCircle(8, 5, 4); // Head
    g.generateTexture('weapon_mace', 16, 16); g.clear();

    // Chalk
    g.fillStyle(0xffffff); g.fillRect(6, 6, 4, 6);
    g.generateTexture('weapon_chalk', 16, 16); g.clear();

    // Book
    g.fillStyle(0xaa00ff); g.fillRect(4, 3, 8, 10);
    g.fillStyle(0xddddff); g.fillRect(5, 4, 1, 8); // Spine
    g.generateTexture('weapon_book', 16, 16); g.clear();

    // Spear
    g.fillStyle(0x8b4513); g.fillRect(7, 5, 2, 11); // Shaft
    g.fillStyle(0xcccccc); g.fillTriangle(8, 0, 5, 5, 11, 5); // Point
    g.generateTexture('weapon_spear', 16, 16); g.clear();

    // Shotgun
    g.fillStyle(0x444444); g.fillRect(2, 7, 12, 3); // Barrel
    g.fillStyle(0x8b4513); g.fillRect(2, 8, 4, 4); // Stock
    g.generateTexture('weapon_shotgun', 16, 16); g.clear();

    // Armor Graphics
    // Shield
    g.fillStyle(0x8b4513); g.fillRoundedRect(3, 3, 10, 10, 2);
    g.fillStyle(0xcccccc); g.fillRect(7, 3, 2, 10); g.fillRect(3, 7, 10, 2);
    g.generateTexture('armor_shield', 16, 16); g.clear();

    // Iron Armor
    g.fillStyle(0xcccccc); g.fillRect(3, 3, 10, 10);
    g.fillStyle(0xaaaaaa); g.fillRect(5, 5, 6, 6);
    g.generateTexture('armor_iron', 16, 16); g.clear();

    // Fur Clothes
    g.fillStyle(0x8b4513); g.fillRect(3, 3, 10, 10);
    g.fillStyle(0x6b3503); g.fillRect(3, 3, 10, 2); // Fur collar
    g.generateTexture('armor_fur', 16, 16); g.clear();

    // Missing Weapons
    // Sword
    g.fillStyle(0x888888); g.fillRect(7, 4, 2, 10); // Blade
    g.fillStyle(0x8b4513); g.fillRect(6, 12, 4, 2); // Guard
    g.generateTexture('weapon_sword', 16, 16); g.clear();

    // Staff
    g.fillStyle(0x8b4513); g.fillRect(7, 4, 2, 12); // Shaft
    g.fillStyle(0x00ffff); g.fillCircle(8, 3, 3); // Gem
    g.generateTexture('weapon_staff', 16, 16); g.clear();

    // Bow
    g.fillStyle(0x8b4513); g.fillEllipse(8, 8, 2, 7); // Bow body
    g.fillStyle(0xffffff); g.fillRect(8, 2, 1, 12); // String
    g.generateTexture('weapon_bow', 16, 16); g.clear();

    // Leather Armor
    g.fillStyle(0x8b4513); g.fillRect(4, 4, 8, 8);
    g.fillStyle(0x6b3503); g.fillRect(5, 5, 6, 6);
    g.generateTexture('armor_leather', 16, 16); g.clear();

    // Scroll
    g.fillStyle(0xeeeecc); g.fillRect(4, 4, 8, 10);
    g.fillStyle(0x8b4513); g.fillRect(3, 4, 1, 10); g.fillRect(12, 4, 1, 10);
    g.generateTexture('scroll', 16, 16); g.clear();
  }

  create() {
    this.playSound('bgm', { loop: true, volume: 0.3 });

    // 4. Monsters Group (Create before map so boss can be added)
    this.monsters = this.physics.add.group();

    // 1. Create Tilemap (Simple Grid for now)
    this.createMap();

    // 2. Create Player
    this.player = this.physics.add.sprite(this.playerStats.x, this.playerStats.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10); // Ensure player renders above the map
    
    this.updatePlayerAppearance(this.playerStats);

    // Add Name Tag
    this.nameTag = this.add.text(this.player.x, this.player.y - 28, `Lv.${this.playerStats.level} ${this.playerStats.nickname || '플레이어'}`, {
      fontSize: '40px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    // Add Guild Tag
    this.guildTag = this.add.text(this.player.x, this.player.y - 16, this.playerStats.guild ? `<${this.playerStats.guild}>` : '', {
      fontSize: '40px',
      color: this.playerStats.isGuildLeader ? '#ff0000' : '#ffff00',
      stroke: '#000000',
      strokeThickness: 8,
      fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.2); // Retro feel, but zoomed out a bit for better view

    // Add collision between player and walls
    this.physics.add.collider(this.player, this.walls);

    // Fog for Wraith Area
    this.fog = this.add.graphics().setDepth(100).setScrollFactor(0);
    this.fog.fillStyle(0x000000, 0.5);
    this.fog.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.fog.setAlpha(0);

    // Initialize React UI with starting stats
    this.updateReactUI();

    // Persistent Minimap (Moved to end of create to ensure all tags are initialized for ignore list)
    this.createMinimap();

    // Listen for guild updates from React
    const guildUpdateHandler = (e: any) => {
      this.playerStats.guild = e.detail.guild;
      if (this.guildTag) {
        this.guildTag.setText(this.playerStats.guild ? `<${this.playerStats.guild}>` : '');
        this.guildTag.setColor(this.playerStats.isGuildLeader ? '#ff0000' : '#ffff00');
      }
    };
    window.addEventListener('update-player-guild', guildUpdateHandler);
    
    // Listen for resurrection
    const resurrectHandler = (e: any) => {
      this.isDead = false;
      this.playerStats.hp = this.playerStats.maxHp;
      this.playerStats.mp = this.playerStats.maxMp;
      if (e.detail && e.detail.gold !== undefined) {
        this.playerStats.gold = e.detail.gold;
      }
      this.player.setPosition(800, 800);
      this.player.clearTint();
      this.updateReactUI();
    };
    window.addEventListener('player-resurrect', resurrectHandler);

    const statsUpdateHandler = (e: any) => {
      this.playerStats = { ...this.playerStats, ...e.detail };
    };
    window.addEventListener('update-player-stats', statsUpdateHandler);

    const teleportHandler = (e: any) => {
      if (this.isDead) return;
      this.player.setPosition(e.detail.x, e.detail.y);
      this.updateReactUI();
    };
    window.addEventListener('player-teleport', teleportHandler);

    const toggleMinimapHandler = (e: any) => {
      if (this.minimapCamera) {
        this.minimapCamera.setVisible(e.detail.visible);
        if (this.minimapBg) {
          this.minimapBg.setVisible(e.detail.visible);
        }
      }
    };
    window.addEventListener('toggle-minimap', toggleMinimapHandler);

    const playSoundHandler = (e: any) => {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        if (this.sound.context.state === 'suspended') {
          this.sound.context.resume().then(() => {
            // If BGM was supposed to be playing but isn't, start it
            if (this.sound.get('bgm') && !this.sound.get('bgm').isPlaying) {
              this.sound.play('bgm', { loop: true, volume: 0.3 });
            }
          });
        }
      }

      if (e.detail && e.detail.key) {
        this.playSound(e.detail.key, e.detail.config);
      }
    };
    window.addEventListener('play-sound', playSoundHandler);

    this.events.on('destroy', () => {
      window.removeEventListener('update-player-guild', guildUpdateHandler);
      window.removeEventListener('player-resurrect', resurrectHandler);
      window.removeEventListener('update-player-stats', statsUpdateHandler);
      window.removeEventListener('player-teleport', teleportHandler);
      window.removeEventListener('toggle-minimap', toggleMinimapHandler);
      window.removeEventListener('play-sound', playSoundHandler);
    });

    // 3. Input Setup
    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    } else {
        // Fallback if keyboard is not available (e.g. mobile)
        this.cursors = {} as any;
        this.wasd = {} as any;
    }

    // Touch/Click movement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        if (this.sound.context.state === 'suspended') {
          this.sound.context.resume().then(() => {
            // If BGM was supposed to be playing but isn't, start it
            if (this.sound.get('bgm') && !this.sound.get('bgm').isPlaying) {
              this.sound.play('bgm', { loop: true, volume: 0.3 });
            }
          });
        }
      }

      // UI 버튼 클릭 여부 확인
      const objectsUnderPointer = this.input.hitTestPointer(pointer);
      if (objectsUnderPointer.length > 0) return;

      // Convert screen coordinates to world coordinates
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.targetPosition = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
      this.targetMonster = null; // Reset target monster on normal click
    });

    // 화면 길게 누르면 지속 이동
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        // UI 버튼 클릭 여부 확인
        const objectsUnderPointer = this.input.hitTestPointer(pointer);
        if (objectsUnderPointer.length > 0) return;
        
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.targetPosition = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
      }
    });

    // 4. Monsters Group (Moved to top of create)
    
    // 5. Items Group
    this.items = this.physics.add.group();
    this.fireballs = this.physics.add.group();

    // 6. Collisions & Interactions
    this.physics.add.collider(this.monsters, this.walls);
    this.physics.add.collider(this.monsters, this.monsters);
    this.physics.add.collider(this.player, this.monsters, this.handlePlayerMonsterCollision as any, undefined, this);

    // Attack monster or interact with NPC on click
    this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (this.isDead) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, (gameObject as any).x, (gameObject as any).y);
      
      if (gameObject === this.npc && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-chief-dialog'));
      } else if (gameObject === this.innNpc && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-inn-dialog'));
      } else if (gameObject === this.ghostNpc && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-ghost-dialog'));
      } else if (gameObject === this.blacksmith && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-blacksmith'));
      } else if (gameObject === this.shopkeeper && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-shop'));
      } else if (gameObject === this.mage && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-mage-shop'));
      } else if (gameObject === this.hunter && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-hunter-shop'));
      } else if (gameObject === this.questNpc && dist < 80) {
        window.dispatchEvent(new CustomEvent('open-quest'));
      } else if (this.monsters.contains(gameObject as Phaser.Physics.Arcade.Sprite)) {
        this.targetMonster = gameObject as Phaser.Physics.Arcade.Sprite;
        this.targetPosition = new Phaser.Math.Vector2((gameObject as any).x, (gameObject as any).y);
      }
    });

    // Collect item
    this.physics.add.overlap(this.player, this.items, this.collectItem as any, undefined, this);
    this.physics.add.overlap(this.player, this.fireballs, this.handleFireballHit as any, undefined, this);

    // Multiplayer setup
    this.playersRef = ref(rtdb, 'players');
    onValue(this.playersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        for (const id in this.otherPlayerSprites) {
          this.otherPlayerSprites[id].destroy();
          delete this.otherPlayerSprites[id];
        }
        return;
      }
      
      for (const id in data) {
        if (id === this.uid) continue;
        
        const pData = data[id];
        if (!this.otherPlayerSprites[id]) {
          const container = this.add.container(pData.x, pData.y);
          const sprite = this.add.sprite(0, 0, 'player');
          
          let tint = parseInt(pData.skinColor?.replace('#', '') || 'ffccaa', 16);
          sprite.setTint(tint);
          if (pData.equippedWeapon === 'bow') sprite.setTint(0xffcc88);
          else if (pData.equippedWeapon === 'staff') sprite.setTint(0x88ccff);
          if (pData.equippedArmor === 'iron') sprite.setTint(0x888888);
          else if (pData.equippedArmor === 'leather') {
            const currentTint = sprite.tintTopLeft;
            sprite.setTint(Phaser.Display.Color.GetColor(
              (currentTint >> 16 & 0xFF) * 0.8,
              (currentTint >> 8 & 0xFF) * 0.8,
              (currentTint & 0xFF) * 0.8
            ));
          }

          const nameTag = this.add.text(0, -28, `Lv.${pData.level || 1} ${pData.nickname || '플레이어'}`, {
            fontSize: '40px', color: '#ffffff', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
          }).setOrigin(0.5, 1).setScale(0.25);
          
          const guildTag = this.add.text(0, -16, pData.guild ? `[${pData.guild}]` : '', {
            fontSize: '36px', color: '#ffff00', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
          }).setOrigin(0.5, 1).setScale(0.25);
          
          container.add([sprite, nameTag, guildTag]);
          container.setDepth(9);
          this.otherPlayerSprites[id] = container;
        } else {
          const container = this.otherPlayerSprites[id];
          // Simple interpolation could be added here, but direct set is fine for now
          container.setPosition(pData.x, pData.y);
          const nameTag = container.list[1] as Phaser.GameObjects.Text;
          if (nameTag) nameTag.setText(`Lv.${pData.level || 1} ${pData.nickname || '플레이어'}`);
          
          const guildTag = container.list[2] as Phaser.GameObjects.Text;
          if (guildTag) guildTag.setText(pData.guild ? `[${pData.guild}]` : '');
          
          const sprite = container.list[0] as Phaser.GameObjects.Sprite;
          if (sprite) {
            let tint = parseInt(pData.skinColor?.replace('#', '') || 'ffccaa', 16);
            sprite.setTint(tint);
            if (pData.equippedWeapon === 'bow') sprite.setTint(0xffcc88);
            else if (pData.equippedWeapon === 'staff') sprite.setTint(0x88ccff);
            if (pData.equippedArmor === 'iron') sprite.setTint(0x888888);
            else if (pData.equippedArmor === 'leather') {
              const currentTint = sprite.tintTopLeft;
              sprite.setTint(Phaser.Display.Color.GetColor(
                (currentTint >> 16 & 0xFF) * 0.8,
                (currentTint >> 8 & 0xFF) * 0.8,
                (currentTint & 0xFF) * 0.8
              ));
            }
          }
        }
      }
      
      for (const id in this.otherPlayerSprites) {
        if (!data[id]) {
          this.otherPlayerSprites[id].destroy();
          delete this.otherPlayerSprites[id];
        }
      }
    });

    // Monster sync setup
    this.monstersRef = ref(rtdb, 'monsters');
    onValue(this.monstersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const now = Date.now();
      this.monsters.getChildren().forEach((monster: any) => {
        const id = monster.getData('id');
        if (!id) return;
        
        const mData = data[id];
        if (mData) {
          monster.setData('hp', mData.hp);
          if (mData.x !== undefined && mData.y !== undefined) {
            if (Phaser.Math.Distance.Between(monster.x, monster.y, mData.x, mData.y) > 50) {
              monster.setPosition(mData.x, mData.y);
            }
          }
          if (mData.deadUntil && mData.deadUntil > now) {
            monster.setVisible(false);
            monster.body.enable = false;
            if (monster.getData('hpBar')) monster.getData('hpBar').clear();
            if (monster.getData('nameTag')) monster.getData('nameTag').setVisible(false);
          } else {
            monster.setVisible(true);
            monster.body.enable = true;
            if (monster.getData('nameTag')) monster.getData('nameTag').setVisible(true);
            if (mData.hp <= 0 && (!mData.deadUntil || mData.deadUntil <= now)) {
              // Time to respawn!
              const startX = monster.getData('startX');
              const startY = monster.getData('startY');
              monster.setPosition(startX, startY);
              monster.setData('hp', monster.getData('maxHp'));
              set(ref(rtdb, `monsters/${id}`), {
                hp: monster.getData('maxHp'),
                x: startX,
                y: startY,
                deadUntil: null
              });
              if (monster.getData('isBoss')) {
                window.dispatchEvent(new CustomEvent('local-system-message', { 
                  detail: { text: `보스 드래곤이 다시 나타났습니다!`, popupOnly: true } 
                }));
              }
            }
          }
        }
      });
    });

    // Generate local monsters using a seed
    this.generateLocalMonsters();

    const myPlayerRef = ref(rtdb, `players/${this.uid}`);
    onDisconnect(myPlayerRef).remove();

    this.events.on('destroy', () => {
      off(this.playersRef);
      remove(myPlayerRef);
    });
    this.events.on('shutdown', () => {
      off(this.playersRef);
      remove(myPlayerRef);
    });
  }

  handleFireballHit(player: any, fireball: any) {
    if (this.isDead) return;
    fireball.destroy();
    
    this.playSound('sfx_hit', { volume: 0.8 });

    this.playerStats.hp -= 20;
    this.lastDamageTime = this.time.now;
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => player.clearTint());
    
    if (this.playerStats.hp <= 0) {
      this.playerStats.hp = 0;
      this.isDead = true;
      this.player.setVelocity(0);
      this.player.setTint(0x555555);
      window.dispatchEvent(new CustomEvent('player-death'));
    }
    this.updateReactUI();
  }

  createMinimap() {
    const minimapSize = 150;
    const padding = 20;
    const mapSize = this.mapWidth * this.tileSize;
    const zoom = minimapSize / mapSize;
    
    // Position adjusted to red rectangle area (below buttons, right of stats)
    const posX = this.scale.width - minimapSize - padding;
    const posY = 120; // Slightly higher as per user request

    this.minimapCamera = this.cameras.add(
      posX,
      posY, 
      minimapSize,
      minimapSize
    ).setZoom(zoom).setName('minimap');
    
    this.minimapCamera.setBackgroundColor(0x222222);
    this.minimapCamera.setBounds(0, 0, mapSize, mapSize);
    this.minimapCamera.centerOn(mapSize / 2, mapSize / 2);
    const ignoreList: any[] = [
      this.nameTag, this.guildTag, this.npcNameTag, this.blacksmithTag, 
      this.shopkeeperTag, this.mageTag, this.hunterTag, this.questNpcTag, 
      this.innNpcTag, this.ghostNameTag, this.fog
    ];
    this.minimapCamera.ignore(ignoreList);
  }

  createMap() {
    // Create a simple 100x100 tilemap
    this.mapWidth = 100;
    this.mapHeight = 100;
    this.tileSize = 32;
    
    // Seeded random generator for consistent map generation across clients
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    this.physics.world.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    this.cameras.main.setBounds(0, 0, this.mapWidth * this.tileSize, this.mapHeight * this.tileSize);
    this.walls = this.physics.add.staticGroup();
    
    // Initialize grid for pathfinding (0 = walkable, 1 = wall)
    this.grid = Array(this.mapHeight).fill(0).map(() => Array(this.mapWidth).fill(0));

    // Add boundary physics (invisible)
    for (let x = 0; x < this.mapWidth; x++) {
      this.walls.create(x * this.tileSize + this.tileSize/2, this.tileSize/2, 'wall').setVisible(false);
      this.walls.create(x * this.tileSize + this.tileSize/2, (this.mapHeight - 1) * this.tileSize + this.tileSize/2, 'wall').setVisible(false);
      this.grid[0][x] = 1;
      this.grid[this.mapHeight - 1][x] = 1;
    }
    for (let y = 0; y < this.mapHeight; y++) {
      this.walls.create(this.tileSize/2, y * this.tileSize + this.tileSize/2, 'wall').setVisible(false);
      this.walls.create((this.mapWidth - 1) * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'wall').setVisible(false);
      this.grid[y][0] = 1;
      this.grid[y][this.mapWidth - 1] = 1;
    }

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const isTown = x >= 20 && x <= 30 && y >= 20 && y <= 30;
        
        // Environment distribution
        const distFromTown = Phaser.Math.Distance.Between(x, y, 25, 25);
        const distFromWolfPlains = Phaser.Math.Distance.Between(x, y, 80, 20); // Top-Right
        const distFromGhostForest = Phaser.Math.Distance.Between(x, y, 20, 80); // Bottom-Left
        const distFromRuinedVillage = Phaser.Math.Distance.Between(x, y, 50, 50); // Middle
        const distFromGoblinMine = Phaser.Math.Distance.Between(x, y, 50, 85); // Bottom
        const distFromOrcVillage = Phaser.Math.Distance.Between(x, y, 80, 80); // Bottom-Right
        const distFromDragonNest = Phaser.Math.Distance.Between(x, y, 87, 87); // Far Bottom-Right
        
        // Skip obstacles in key areas
        const isSafeFromObstacles = isTown || distFromRuinedVillage < 10 || distFromOrcVillage < 15 || distFromDragonNest < 10 || distFromWolfPlains < 12 || distFromGhostForest < 15 || distFromGoblinMine < 15;
        
        const isForest = !isSafeFromObstacles && random() < 0.05; // Reduced density
        const isStoneArea = !isSafeFromObstacles && random() < 0.02; // Reduced density
        
        let texture = 'grass';
        if (isTown) texture = 'town_floor';
        else if (distFromRuinedVillage < 10) texture = 'town_floor';
        else if (distFromOrcVillage < 15) texture = 'town_floor'; 
        else if (distFromGhostForest < 15) texture = 'town_floor'; 
        else if (distFromWolfPlains < 12) texture = 'grass'; 
        else if (distFromGoblinMine < 15) texture = 'town_floor'; 
        
        // Always draw floor first
        const tile = this.add.image(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, texture).setDepth(0);
        
        // Visual cues for regions
        if (distFromRuinedVillage < 10) {
          tile.setTint(0x886644); // Brownish for ruined village
          if (random() < 0.1) {
            const ruined = this.walls.create(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'stone').setDepth(1);
            ruined.setTint(0x664422);
            this.grid[y][x] = 1;
          }
        } else if (distFromGhostForest < 15) {
          tile.setTint(0x444466); // Darker blue for ghost forest
          if (random() < 0.08) { // Add ruined structures
            const ruined = this.walls.create(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'stone').setDepth(1);
            ruined.setTint(0x333355);
            this.grid[y][x] = 1;
          }
        } else if (distFromOrcVillage < 15) {
          tile.setTint(0x664444); // Darker red for orc camp
        } else if (distFromGoblinMine < 15) {
          tile.setTint(0x446644); // Darker green for goblin mine
          if (random() < 0.05) { // Add goblin tents/huts
            const hut = this.walls.create(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'building').setDepth(1).setScale(0.5);
            hut.setTint(0x444400);
            this.grid[y][x] = 1;
          }
        } else if (distFromWolfPlains < 12) {
          tile.setTint(0x666644); // Darker yellow for wolf plains
          if (random() < 0.05) { // Add bushes/dens
            const bush = this.walls.create(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'tree').setDepth(1).setScale(0.7);
            bush.setTint(0x445522);
            this.grid[y][x] = 1;
          }
        }
        
        if (isForest || isStoneArea) {
          let obstacleTexture = isForest ? 'tree' : 'stone';
          this.walls.create(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, obstacleTexture).setDepth(1);
          this.grid[y][x] = 1;
        }
      }
    }

    // Add Buildings in Town
    const addBuilding = (cx: number, cy: number) => {
      const b = this.walls.create(cx * this.tileSize, cy * this.tileSize, 'building').setDepth(2);
      b.body.setSize(96, 64);
      this.grid[cy-1][cx-1] = 1; this.grid[cy-1][cx] = 1; this.grid[cy-1][cx+1] = 1;
      this.grid[cy][cx-1] = 1; this.grid[cy][cx] = 1; this.grid[cy][cx+1] = 1;
    };
    addBuilding(23, 22);
    addBuilding(28, 22);
    addBuilding(23, 28);
    addBuilding(28, 28);

    // Add NPCs in Town
    this.npc = this.physics.add.sprite(25 * this.tileSize, 25 * this.tileSize, 'npc_chief');
    this.npc.setImmovable(true);
    this.npc.setInteractive();
    this.npc.setDepth(5);
    this.npcNameTag = this.add.text(this.npc.x, this.npc.y - 20, '마을 촌장', {
      fontSize: '40px', color: '#ffff00', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.blacksmith = this.physics.add.sprite(23 * this.tileSize, 24 * this.tileSize, 'npc_blacksmith');
    this.blacksmith.setImmovable(true);
    this.blacksmith.setInteractive();
    this.blacksmith.setDepth(5);
    this.blacksmithTag = this.add.text(this.blacksmith.x, this.blacksmith.y - 20, '대장장이', {
      fontSize: '40px', color: '#ffaa00', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.shopkeeper = this.physics.add.sprite(28 * this.tileSize, 24 * this.tileSize, 'npc_shop');
    this.shopkeeper.setImmovable(true);
    this.shopkeeper.setInteractive();
    this.shopkeeper.setDepth(5);
    this.shopkeeperTag = this.add.text(this.shopkeeper.x, this.shopkeeper.y - 20, '상인', {
      fontSize: '40px', color: '#00ffaa', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.mage = this.physics.add.sprite(23 * this.tileSize, 29 * this.tileSize, 'npc_shop');
    this.mage.setTint(0x0000ff);
    this.mage.setImmovable(true);
    this.mage.setInteractive();
    this.mage.setDepth(5);
    this.mageTag = this.add.text(this.mage.x, this.mage.y - 20, '마법사', {
      fontSize: '40px', color: '#00aaff', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.hunter = this.physics.add.sprite(28 * this.tileSize, 29 * this.tileSize, 'npc_shop');
    this.hunter.setTint(0x00ff00);
    this.hunter.setImmovable(true);
    this.hunter.setInteractive();
    this.hunter.setDepth(5);
    this.hunterTag = this.add.text(this.hunter.x, this.hunter.y - 20, '사냥꾼', {
      fontSize: '40px', color: '#aaff00', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    this.questNpc = this.physics.add.sprite(25 * this.tileSize, 28 * this.tileSize, 'npc_chief');
    this.questNpc.setTint(0xff00ff);
    this.questNpc.setImmovable(true);
    this.questNpc.setInteractive();
    this.questNpc.setDepth(5);
    this.questNpcTag = this.add.text(this.questNpc.x, this.questNpc.y - 20, '퀘스트 NPC', {
      fontSize: '40px', color: '#ff00ff', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    // Add Inn NPC in Town
    this.innNpc = this.physics.add.sprite(27 * this.tileSize, 25 * this.tileSize, 'npc_chief');
    this.innNpc.setTint(0x00ffff);
    this.innNpc.setImmovable(true);
    this.innNpc.setInteractive();
    this.innNpc.setDepth(5);
    this.innNpcTag = this.add.text(this.innNpc.x, this.innNpc.y - 20, '여관 주인', {
      fontSize: '40px', color: '#00ffff', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    // Add Ghost NPC in Ruined Village
    this.ghostNpc = this.physics.add.sprite(50 * this.tileSize, 50 * this.tileSize, 'npc_chief');
    this.ghostNpc.setTint(0x8888ff, 0x8888ff, 0xccccff, 0xccccff);
    this.ghostNpc.setAlpha(0.6);
    this.ghostNpc.setImmovable(true);
    this.ghostNpc.setInteractive();
    this.ghostNpc.setDepth(5);
    this.ghostNameTag = this.add.text(this.ghostNpc.x, this.ghostNpc.y - 20, '지박령', {
      fontSize: '40px', color: '#aaaaff', stroke: '#000000', strokeThickness: 8, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);

    // Add Dungeon Area
    for (let y = 80; y < 95; y++) {
      for (let x = 80; x < 95; x++) {
        const tile = this.add.image(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'town_floor');
        tile.setTint(0xff0000); // Red floor for dungeon
        tile.setDepth(0);
      }
    }
    
    // Add Orc Village
    for (let y = 50; y < 60; y++) {
      for (let x = 50; x < 60; x++) {
        const tile = this.add.image(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, 'town_floor');
        tile.setTint(0x885522); // Brown floor for orc village
        tile.setDepth(0);
      }
    }
    const addOrcTent = (cx: number, cy: number) => {
      const b = this.walls.create(cx * this.tileSize, cy * this.tileSize, 'building').setDepth(2);
      b.setTint(0x55ff55);
      b.body.setSize(96, 64);
      this.grid[cy-1][cx-1] = 1; this.grid[cy-1][cx] = 1; this.grid[cy-1][cx+1] = 1;
      this.grid[cy][cx-1] = 1; this.grid[cy][cx] = 1; this.grid[cy][cx+1] = 1;
    };
    addOrcTent(53, 53);
    addOrcTent(57, 53);
    addOrcTent(55, 57);
    
    // Add Boss
    this.spawnBoss();
  }

  updatePlayerAppearance(stats: any) {
    if (!this.player) return;
    
    // Base appearance
    let tint = parseInt(stats.skinColor?.replace('#', '') || 'ffccaa', 16);
    this.player.setTint(tint);

    // Equipment visuals
    if (stats.equippedWeapon === 'sword') {
      // Keep base tint
    } else if (stats.equippedWeapon === 'bow') {
      this.player.setTint(0xffcc88); // Orange-ish for bow
    } else if (stats.equippedWeapon === 'staff') {
      this.player.setTint(0x88ccff); // Blue-ish for staff
    }
    
    if (stats.equippedArmor === 'iron') {
      this.player.setTint(0x888888); // Gray for iron armor
    } else if (stats.equippedArmor === 'leather') {
      // Darken slightly for leather armor
      const currentTint = this.player.tintTopLeft;
      this.player.setTint(Phaser.Display.Color.GetColor(
        (currentTint >> 16 & 0xFF) * 0.8,
        (currentTint >> 8 & 0xFF) * 0.8,
        (currentTint & 0xFF) * 0.8
      ));
    }
  }

  spawnBoss() {
    if (this.boss && this.boss.active) return;

    this.boss = this.physics.add.sprite(87 * this.tileSize, 87 * this.tileSize, 'dragon');
    this.boss.setInteractive();
    this.boss.setDepth(5);
    this.boss.setData('hp', 2000);
    this.boss.setData('maxHp', 2000);
    this.boss.setData('startX', 87 * this.tileSize);
    this.boss.setData('startY', 87 * this.tileSize);
    this.boss.setData('type', 'dragon');
    this.boss.setData('name', '드래곤 보스');
    this.boss.setData('drop', 'item_dragon_heart');
    this.boss.setData('dropName', '드래곤의 심장');
    this.boss.setData('exp', 1000);
    this.boss.setData('isBoss', true);
    this.boss.setData('id', 'boss_dragon');
    
    if (this.bossNameTag) this.bossNameTag.destroy();
    this.bossNameTag = this.add.text(this.boss.x, this.boss.y - 40, '드래곤 보스', {
      fontSize: '56px', color: '#ff0000', stroke: '#000000', strokeThickness: 12, fontFamily: 'monospace'
    }).setOrigin(0.5, 1).setDepth(11).setScale(0.25);
    
    if (this.bossHpBar) this.bossHpBar.clear();
    else {
      this.bossHpBar = this.add.graphics();
      this.bossHpBar.setDepth(11);
    }
    
    this.boss.setData('nameTag', this.bossNameTag);
    this.boss.setData('hpBar', this.bossHpBar);

    this.monsters.add(this.boss);

    if (this.minimapCamera) {
      this.minimapCamera.ignore([this.bossNameTag, this.bossHpBar]);
    }
  }

  generateLocalMonsters() {
    let seed = 8888;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const wolfPlainsPos = { x: 80 * this.tileSize, y: 20 * this.tileSize };
    const orcVillagePos = { x: 80 * this.tileSize, y: 80 * this.tileSize };
    const ghostForestPos = { x: 20 * this.tileSize, y: 80 * this.tileSize };
    const goblinMinePos = { x: 50 * this.tileSize, y: 85 * this.tileSize };
    const dragonNestPos = { x: 87 * this.tileSize, y: 87 * this.tileSize };

    for (let i = 0; i < 200; i++) {
      const x = random() * (this.mapWidth * this.tileSize);
      const y = random() * (this.mapHeight * this.tileSize);

      // Prevent spawning in town
      if (Phaser.Math.Distance.Between(x, y, 800, 800) < 300) continue;

      let type = 'slime';
      let hp = 30;
      let name = '슬라임';
      let drop = 'item_slime_jelly';
      let dropName = '슬라임의 점액';
      let exp = 10;

      const distFromWolfPlains = Phaser.Math.Distance.Between(x, y, wolfPlainsPos.x, wolfPlainsPos.y);
      const distFromOrcVillage = Phaser.Math.Distance.Between(x, y, orcVillagePos.x, orcVillagePos.y);
      const distFromGhostForest = Phaser.Math.Distance.Between(x, y, ghostForestPos.x, ghostForestPos.y);
      const distFromGoblinMine = Phaser.Math.Distance.Between(x, y, goblinMinePos.x, goblinMinePos.y);
      const distFromDragonNest = Phaser.Math.Distance.Between(x, y, dragonNestPos.x, dragonNestPos.y);

      if (distFromDragonNest < 400) continue; // No regular monsters in dragon nest

      if (distFromWolfPlains < 400) {
        type = 'wolf'; hp = 50; name = '늑대'; drop = 'item_wolf_fur'; dropName = '늑대의 가죽'; exp = 15;
      } else if (distFromOrcVillage < 600) {
        type = 'orc'; hp = 150; name = '오크'; drop = 'item_orc_tooth'; dropName = '오크의 이빨'; exp = 40;
      } else if (distFromGhostForest < 600) {
        type = 'ghost'; hp = 250; name = '망령'; drop = 'item_ectoplasm'; dropName = '망령의 파편'; exp = 60;
      } else if (distFromGoblinMine < 600) {
        type = 'goblin'; hp = 80; name = '고블린'; drop = 'item_goblin_ear'; dropName = '고블린의 귀'; exp = 25;
      } else {
        if (random() > 0.4) continue; // Reduce slime density
      }

      const id = `monster_${i}`;
      const monster = this.monsters.create(x, y, type);
      monster.setInteractive();
      monster.setDepth(5);
      monster.setData('id', id);
      monster.setData('type', type);
      monster.setData('hp', hp);
      monster.setData('maxHp', hp);
      monster.setData('startX', x);
      monster.setData('startY', y);
      monster.setData('name', name);
      monster.setData('drop', drop);
      monster.setData('dropName', dropName);
      monster.setData('exp', exp);
      monster.setData('lastPathTime', 0);
      monster.setData('path', []);

      // Add name tag
      const nameTag = this.add.text(x, y - 20, name, {
        fontSize: '24px', color: '#ffaaaa', stroke: '#000000', strokeThickness: 4, fontFamily: 'monospace'
      }).setOrigin(0.5, 1).setDepth(6).setScale(0.5);
      monster.setData('nameTag', nameTag);
      
      const hpBar = this.add.graphics();
      hpBar.setDepth(6);
      monster.setData('hpBar', hpBar);
    }
  }

  handlePlayerMonsterCollision(player: Phaser.Physics.Arcade.Sprite, monster: Phaser.Physics.Arcade.Sprite) {
    if (this.isDead) return;

    if (this.time.now - this.lastDamageTime > 1000) {
      this.playSound('sfx_hit', { volume: 0.8 });
      this.playerStats.hp -= 10;
      this.lastDamageTime = this.time.now;
      
      // Visual feedback for taking damage
      player.setTint(0xff0000);
      this.time.delayedCall(200, () => player.clearTint());
      
      if (this.playerStats.hp <= 0) {
        this.playerStats.hp = 0;
        this.isDead = true;
        this.player.setVelocity(0);
        this.player.setTint(0x555555);
        window.dispatchEvent(new CustomEvent('player-death'));
      }
      this.updateReactUI();
    }
  }

  attackMonster(monster: Phaser.Physics.Arcade.Sprite) {
    if (this.isDead) return;

    if (this.time.now - this.lastAttackTime < 500) return; // 500ms attack cooldown
    
    const weapon = this.playerStats.equippedWeapon || '';
    const isStaff = weapon.includes('staff');
    const isBow = weapon.includes('bow');
    const isChalk = weapon.includes('chalk');
    const isBook = weapon.includes('book');
    const isShotgun = weapon.includes('shotgun');
    const isSpear = weapon.includes('spear');
    const isRanged = isStaff || isBow || isChalk || isBook || isShotgun;

    if (isStaff) {
      if (this.playerStats.mp < 5) {
        // Update lastAttackTime even on failure to prevent message spam
        this.lastAttackTime = this.time.now;
        window.dispatchEvent(new CustomEvent('local-system-message', { 
          detail: { text: `마나가 부족합니다! (필요: 5)`, popupOnly: true } 
        }));
        return;
      }
      this.playerStats.mp -= 5;
      this.updateReactUI();
    }

    this.lastAttackTime = this.time.now;
    this.playSound('sfx_attack', { volume: 0.8 });

    // Simple distance check
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
    const attackRange = isRanged ? 200 : (isSpear ? 80 : 50);

    if (dist < attackRange) {
      // Visual feedback for attacking
      this.tweens.add({
        targets: monster,
        alpha: 0.3,
        yoyo: true,
        duration: 100
      });

      // Show projectile if ranged
      if (isRanged) {
        let projectile: any;
        if (isChalk) {
          projectile = this.add.rectangle(this.player.x, this.player.y, 8, 4, 0xffffff);
        } else if (isBook) {
          projectile = this.add.rectangle(this.player.x, this.player.y, 10, 12, 0xaa00ff);
          // Add a line to make it look like a book
          const line = this.add.rectangle(0, 0, 2, 12, 0xddddff);
          projectile.add ? projectile.add(line) : null; // If it was a container, but it's just a rect
        } else if (isStaff) {
          projectile = this.add.circle(this.player.x, this.player.y, 6, 0x00ffff);
        } else if (isBow) {
          projectile = this.add.circle(this.player.x, this.player.y, 4, 0x8b4513);
        } else if (isShotgun) {
          projectile = this.add.circle(this.player.x, this.player.y, 3, 0x555555);
        } else {
          projectile = this.add.circle(this.player.x, this.player.y, 4, 0xffffff);
        }

        this.tweens.add({
          targets: projectile,
          x: monster.x,
          y: monster.y,
          duration: 200,
          onComplete: () => projectile.destroy()
        });
      }

      let damage = Math.floor(10 + (this.playerStats.atk || 0) + (this.playerStats.level * 2));
      let hp = monster.getData('hp');
      hp -= damage;
      monster.setData('hp', hp);

      // Update Firebase
      const id = monster.getData('id');
      if (id) {
        if (hp <= 0) {
          set(ref(rtdb, `monsters/${id}`), {
            hp: 0,
            deadUntil: Date.now() + (monster.getData('isBoss') ? 180000 : 30000) // 3 mins for boss, 30s for normal
          });
        } else {
          set(ref(rtdb, `monsters/${id}`), {
            hp: hp,
            x: Math.round(monster.x),
            y: Math.round(monster.y)
          });
        }
      }

      // Show Damage Number
      this.showDamageNumber(monster.x, monster.y, damage);

      if (hp <= 0) {
        const mType = monster.getData('type');
        const mName = monster.getData('name');
        const mDrop = monster.getData('drop');
        const mDropName = monster.getData('dropName');
        const mExp = monster.getData('exp');
        const isBoss = monster.getData('isBoss');

        // Hide monster instead of destroying
        monster.setVisible(false);
        monster.body.enable = false;
        if (monster.getData('hpBar')) monster.getData('hpBar').clear();
        if (monster.getData('nameTag')) monster.getData('nameTag').setVisible(false);

        if (this.targetMonster === monster) this.targetMonster = null;
        
        if (isBoss) {
          window.dispatchEvent(new CustomEvent('local-system-message', { 
            detail: { text: `보스 드래곤이 처치되었습니다! 3분 후 다시 나타납니다.`, popupOnly: true } 
          }));
        }
        // System Message
        window.dispatchEvent(new CustomEvent('local-system-message', { 
          detail: { text: `${mName}을(를) 죽였습니다! (+${mExp} EXP)` } 
        }));

        window.dispatchEvent(new CustomEvent('monster-killed', {
          detail: { type: mType }
        }));

        // Drop item
        const item = this.items.create(monster.x, monster.y, mDrop);
        item.setDepth(4);
        item.setData('itemId', mDrop);
        item.setData('itemName', mDropName);
        
        // Randomly drop potion too
        if (Math.random() < 0.3) {
          const potion = this.items.create(monster.x + 10, monster.y + 10, 'item_potion');
          potion.setDepth(4);
          potion.setData('itemId', 'item_potion');
          potion.setData('itemName', '빨간 물약');
        }

        // EXP Gain logic
        this.gainExp(mExp);
      }
    } else {
      console.log('Too far to attack!');
    }
  }

  showDamageNumber(x: number, y: number, damage: number) {
    const text = this.add.text(x, y - 20, `-${damage}`, {
      fontSize: '40px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      fontFamily: 'monospace'
    }).setOrigin(0.5).setScale(0.25).setDepth(20);

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    });
  }

  gainExp(amount: number) {
    this.playerStats.exp += amount;
    if (this.playerStats.exp >= this.playerStats.maxExp) {
      this.playSound('sfx_level_up', { volume: 0.8 });
      this.playerStats.level++;
      this.playerStats.exp -= this.playerStats.maxExp;
      this.playerStats.maxExp = Math.floor(this.playerStats.maxExp * 1.2 + 50);
      this.playerStats.maxHp += 20;
      this.playerStats.hp = this.playerStats.maxHp;
      
      // Update name tag on level up
      if (this.nameTag) {
        this.nameTag.setText(`Lv.${this.playerStats.level} ${this.playerStats.nickname || '플레이어'}`);
      }
    }
    this.updateReactUI();
  }

  updateReactUI() {
    window.dispatchEvent(new CustomEvent('player-stats-update', { detail: { ...this.playerStats } }));
    window.dispatchEvent(new CustomEvent('save-player-data', { detail: { ...this.playerStats, x: this.player.x, y: this.player.y } }));
  }

  showSpeechBubble(x: number, y: number, text: string) {
    const bubbleWidth = 150;
    const bubbleHeight = 40;
    const bubblePadding = 10;
    const bubble = this.add.graphics({ x: x, y: y - 50 });
    
    bubble.fillStyle(0xffffff, 1);
    bubble.lineStyle(2, 0x000000, 1);
    bubble.fillRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
    bubble.strokeRoundedRect(-bubbleWidth/2, -bubbleHeight, bubbleWidth, bubbleHeight, 8);
    
    // Tail
    bubble.fillTriangle(-10, 0, 10, 0, 0, 10);
    bubble.strokeTriangle(-10, 0, 10, 0, 0, 10);
    
    const content = this.add.text(x, y - 50 - bubbleHeight/2, text, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: (bubbleWidth - bubblePadding * 2) * 4 }
    }).setOrigin(0.5, 0.5).setScale(0.25);
    
    bubble.setDepth(20);
    content.setDepth(21);
    
    this.time.delayedCall(3000, () => {
      bubble.destroy();
      content.destroy();
    });
  }

  collectItem(player: Phaser.Physics.Arcade.Sprite, item: Phaser.Physics.Arcade.Sprite) {
    if (this.isDead) return;
    
    this.playSound('sfx_item', { volume: 0.8 });

    const itemId = item.getData('itemId') || 'item_unknown';
    const itemName = item.getData('itemName') || '알 수 없는 아이템';
    item.destroy();
    
    window.dispatchEvent(new CustomEvent('local-system-message', { 
      detail: { text: `${itemName}을(를) 획득했습니다!` } 
    }));

    // Dispatch event to React Inventory
    window.dispatchEvent(new CustomEvent('item-collected', { detail: { id: itemId, name: itemName } }));
  }

  findPath(startX: number, startY: number, endX: number, endY: number) {
    // Very simple BFS pathfinding on the grid
    const startCol = Math.floor(startX / this.tileSize);
    const startRow = Math.floor(startY / this.tileSize);
    const endCol = Math.floor(endX / this.tileSize);
    const endRow = Math.floor(endY / this.tileSize);

    if (startCol === endCol && startRow === endRow) return [];
    if (this.grid[endRow]?.[endCol] === 1) return []; // Target is in wall

    const queue = [{ c: startCol, r: startRow, path: [] as {c: number, r: number}[] }];
    const visited = new Set([`${startCol},${startRow}`]);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0 && queue.length < 100) { // Limit search depth for performance
      const { c, r, path } = queue.shift()!;

      if (c === endCol && r === endRow) return path;

      for (const [dc, dr] of dirs) {
        const nc = c + dc;
        const nr = r + dr;
        if (nc >= 0 && nc < this.mapWidth && nr >= 0 && nr < this.mapHeight) {
          if (this.grid[nr][nc] === 0 && !visited.has(`${nc},${nr}`)) {
            visited.add(`${nc},${nr}`);
            queue.push({ c: nc, r: nr, path: [...path, { c: nc, r: nr }] });
          }
        }
      }
    }
    return [];
  }

  update() {
    if (!this.player) return;

    // Sync position to RTDB (throttle to 10fps)
    if (this.time.now - this.lastSyncTime > 100) {
      if (this.player.x !== this.lastSyncX || this.player.y !== this.lastSyncY) {
        this.lastSyncTime = this.time.now;
        this.lastSyncX = this.player.x;
        this.lastSyncY = this.player.y;
        set(ref(rtdb, `players/${this.uid}`), {
          x: this.player.x,
          y: this.player.y,
          nickname: this.playerStats.nickname || '플레이어',
          level: this.playerStats.level || 1,
          guild: this.playerStats.guild || null,
          equippedWeapon: this.playerStats.equippedWeapon || null,
          equippedArmor: this.playerStats.equippedArmor || null,
          skinColor: this.playerStats.skinColor || '#ffccaa'
        });
      }
    }

    // Update name tag and guild tag positions
    if (this.nameTag) {
      this.nameTag.setPosition(this.player.x, this.player.y - 28);
    }
    if (this.guildTag) {
      this.guildTag.setPosition(this.player.x, this.player.y - 16);
    }

    // Render Boss HP Bar
    if (this.boss && this.boss.active && this.boss.visible) {
      this.bossNameTag.setPosition(this.boss.x, this.boss.y - 40);
      this.bossHpBar.clear();
      const hp = this.boss.getData('hp');
      const maxHp = this.boss.getData('maxHp');
      const width = 60;
      const height = 6;
      const x = this.boss.x - width / 2;
      const y = this.boss.y - 35;
      
      this.bossHpBar.fillStyle(0x000000);
      this.bossHpBar.fillRect(x, y, width, height);
      this.bossHpBar.fillStyle(0xff0000);
      this.bossHpBar.fillRect(x, y, width * (hp / maxHp), height);
    } else if (this.bossHpBar) {
      this.bossHpBar.clear();
    }

    // Reset velocity
    this.player.setVelocity(0);

    if (this.isDead) return;

    // Boss AI - Fireball attack
    if (this.boss && this.boss.active && this.boss.visible) {
      const distToPlayer = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
      if (distToPlayer < 400) {
        if (this.time.now - this.lastBossFireTime > 2000) {
          this.lastBossFireTime = this.time.now;
          const fireball = this.fireballs.create(this.boss.x, this.boss.y, 'item_potion') as Phaser.Physics.Arcade.Sprite;
          fireball.setTint(0xff4400);
          fireball.setScale(1.5);
          this.physics.moveToObject(fireball, this.player, 200);
          this.time.delayedCall(3000, () => { if (fireball.active) fireball.destroy(); });
        }
      }
    }

    // Press and hold movement
    if (this.input.activePointer.isDown && !this.input.activePointer.leftButtonReleased()) {
      const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      // Only move if not clicking on a UI element or NPC (handled by gameobjectdown)
      // But we want to move towards the pointer if it's held down
      this.targetPosition = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
      this.targetMonster = null;
    }

    let isMovingKeyboard = false;
    let vx = 0;
    let vy = 0;

    // Keyboard Movement (WASD + Arrows)
    if (this.cursors?.left?.isDown || this.wasd?.left?.isDown) {
      vx = -this.speed;
      isMovingKeyboard = true;
    } else if (this.cursors?.right?.isDown || this.wasd?.right?.isDown) {
      vx = this.speed;
      isMovingKeyboard = true;
    }

    if (this.cursors?.up?.isDown || this.wasd?.up?.isDown) {
      vy = -this.speed;
      isMovingKeyboard = true;
    } else if (this.cursors?.down?.isDown || this.wasd?.down?.isDown) {
      vy = this.speed;
      isMovingKeyboard = true;
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }
    this.player.setVelocity(vx, vy);

    // Spacebar Attack
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      // Find nearest monster
      let nearestMonster: Phaser.Physics.Arcade.Sprite | null = null;
      const isRanged = this.playerStats.equippedWeapon === 'bow' || this.playerStats.equippedWeapon === 'staff';
      let minDistance = isRanged ? 150 : 50; // Attack range
      
      this.monsters.getChildren().forEach((monsterObj) => {
        const m = monsterObj as Phaser.Physics.Arcade.Sprite;
        if (m.active && m.visible) {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
          if (dist < minDistance) {
            minDistance = dist;
            nearestMonster = m;
          }
        }
      });
      
      if (nearestMonster) {
        this.attackMonster(nearestMonster);
      }
    }

    // Touch/Click Movement
    if (isMovingKeyboard) {
      this.targetPosition = null; // Cancel touch movement if keyboard is used
      // Do not cancel targetMonster so player can click to attack while moving
    }
    
    if (this.targetMonster && this.targetMonster.active && this.targetMonster.visible) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetMonster.x, this.targetMonster.y);
      const isRanged = this.playerStats.equippedWeapon === 'bow' || this.playerStats.equippedWeapon === 'staff';
      const attackRange = isRanged ? 150 : 50;
      
      if (distance < attackRange) {
        if (!isMovingKeyboard) this.player.setVelocity(0);
        this.targetPosition = null;
        this.attackMonster(this.targetMonster);
      } else if (!isMovingKeyboard) {
        this.targetPosition = new Phaser.Math.Vector2(this.targetMonster.x, this.targetMonster.y);
        this.physics.moveToObject(this.player, this.targetPosition, this.speed);
      }
    } else if (this.targetPosition && !isMovingKeyboard) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetPosition.x, this.targetPosition.y);
      
      if (distance < 4) {
        this.player.setVelocity(0);
        this.targetPosition = null;
      } else {
        this.physics.moveToObject(this.player, this.targetPosition, this.speed);
      }
    }

    // Play footstep sound if moving
    if (this.player.body.velocity.lengthSq() > 10) {
      if (this.time.now - this.lastFootstepTime > 400) {
        this.playSound('sfx_footstep', { volume: 0.3 });
        this.lastFootstepTime = this.time.now;
      }
    }

    // Update monsters to keep following player (Aggro system with simple pathfinding)
    this.monsters.getChildren().forEach((m) => {
      const monster = m as Phaser.Physics.Arcade.Sprite;
      if (!monster.active || !monster.visible) return;
      
      const nameTag = monster.getData('nameTag');
      if (nameTag && !monster.getData('isBoss')) nameTag.setPosition(monster.x, monster.y - 20);
      
      const hpBar = monster.getData('hpBar');
      if (hpBar && !monster.getData('isBoss')) {
        hpBar.clear();
        const hp = monster.getData('hp');
        const maxHp = monster.getData('maxHp');
        const width = 30;
        const height = 4;
        const x = monster.x - width / 2;
        const y = monster.y - 15;
        hpBar.fillStyle(0x000000);
        hpBar.fillRect(x, y, width, height);
        hpBar.fillStyle(0xff0000);
        hpBar.fillRect(x, y, width * (hp / maxHp), height);
      }

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      
      // Don't aggro if player is in town (safe zone) or dead
      const playerDistFromTown = Phaser.Math.Distance.Between(this.player.x, this.player.y, 800, 800);
      
      if (dist < 200 && playerDistFromTown > 200 && !this.isDead) { // Aggro radius
        // Simple obstacle avoidance / pathfinding update every 500ms
        if (this.time.now - monster.getData('lastPathTime') > 500) {
          monster.setData('lastPathTime', this.time.now);
          
          // Check if direct line of sight is blocked (simple heuristic: are we stuck?)
          if (monster.body?.velocity.lengthSq() < 100 && dist > 40) {
            const path = this.findPath(monster.x, monster.y, this.player.x, this.player.y);
            monster.setData('path', path);
          } else {
            monster.setData('path', []); // Clear path, move directly
          }
        }

        const path = monster.getData('path');
        if (path && path.length > 0) {
          const nextNode = path[0];
          const targetX = nextNode.c * this.tileSize + this.tileSize/2;
          const targetY = nextNode.r * this.tileSize + this.tileSize/2;
          
          if (Phaser.Math.Distance.Between(monster.x, monster.y, targetX, targetY) < 10) {
            path.shift(); // Reached node
          } else {
            this.physics.moveTo(monster, targetX, targetY, 40);
          }
        } else {
          this.physics.moveToObject(monster, this.player, 40);
        }
      } else {
        monster.setVelocity(0); // Stop moving if player is too far or in town
      }
    });

    // Fog Effect for Wraith Area
    const distFromGhostForest = Phaser.Math.Distance.Between(this.player.x, this.player.y, 20 * this.tileSize, 80 * this.tileSize);
    if (distFromGhostForest < 600) {
      if (this.fog.alpha < 0.7) this.fog.setAlpha(this.fog.alpha + 0.01);
    } else {
      if (this.fog.alpha > 0) this.fog.setAlpha(this.fog.alpha - 0.01);
    }
  }
}
