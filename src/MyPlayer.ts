import { Label } from "@akashic-extension/akashic-label";
import { GameMaster } from "./GameMaster";
import { JigsawPiece } from "./JigsawPiece";
import { Point, PazzlePieceInfo } from "./Tuples";

/**
 * このゲームの プレイヤークラス。  
 * すでに参加しているプレイヤーが別デバイスから参加すると、  
 * 古いデバイスでは操作出来なくなるようにする予定。
 */
export class MyPlayer {
  /** 参加プレイヤーのリスト。 */
  static players: MyPlayer[] = new Array();
  /** 放送者のニコニコユーザーID。 */
  static liverId: string | undefined;
  /** ゲームのホストのプレイヤーID。 */
  static hostPlayerId: number;
  /**
   * 今まで参加したプレイヤーの人数合計。  
   * `localPlayerId` に利用する。
   */
  static count: number = 0;
  /**
   * プレイヤー数。
   */
  static get playerCnt(): number {
    return this.players.length;
  }
  /**
   * アクティブプレイヤーだけの、プレイヤー一覧。
   */
  static get activePlayers(): MyPlayer[] {
    let players: MyPlayer[] = new Array();
    for(let p of this.players) {
      if(p.active) players.push(p);
    }
    return players;
  }
  /**
   * アクティブプレイヤー数。
   */
  static get actPlayerCnt(): number {
    return this.activePlayers.length;
  }

  /**
   * 「この端末」のプレイヤーID。ローカルな値。  
   * この値を使って複数デバイスでのプレイを阻止する。
   */
  static localPlayerId: number;
  /**
   * 「この端末」のプレイヤーがゲームに参加しているか。  
   * この値が `true` かつ `localPlayerId == undefined` の時に実行されたプレイヤー情報が  
   * `p.nicoId == g.game.selfId` の時に、 `localPlayerId` を `p.playerId`にする。
   */
  static localPlayerPlaying: boolean = false;

  /** ホストプレイヤーが変更された時に呼ばれるイベント。 */
  static changeHostEvent: ((p: MyPlayer) => void)[] = new Array();

  /** 非アクティブにするまでの時間（秒）。 */
  static activeTime: number = 30;
  /** ３０秒毎に実行する、 `deactivate` が `true` なら `active` を `false` にするイベント。 */
  static deactivateEvent: g.TimerIdentifier;

  /**
   * ニコニコのユーザーID。  
   * 存在しない可能性がある。  
   * イベント等の `ev.palyer.id` はこっち。
   */
  nicoId: string | undefined;
  /**
   * このゲーム上で識別するためのID。  
   * `nicoId` とは別。
   */
  playerId: number;
  /** ユーザー固有の絶対に変わらないID。最初のプレイヤーID。 */
  ID: number;
  /** BAN されているかどうか。 */
  BAN: boolean;
  /** プレイヤー名。 */
  name: string;
  /** スコア。 */
  score: number;
  /** ランク。 */
  rank: number;
  /** カーソルの位置。 */
  cursorPos: Point;

  /** `nameLabel` 用のフォント。 */
  private nameFont: g.Font;
  /** 名前を表示するレイヤー。 */
  private nameDisplay: g.E;
  /** ピースを動かした時に表示する名前。 */
  private nameLabel: Label;
  /** ピースを非表示にするイベント。 */
  private nameHideEvent: g.TimerIdentifier;

  // アクティビティを変更するためのもの
  /** プレイヤーがアクティブかどうか。 */
  active: boolean = true;
  /** 非アクティブにするかどうかを測るフラグ。３０秒毎に `true` になる。 */
  deactivate: boolean = true;

  /**
   * 持っているピース。
   */
  private _holdPiece: JigsawPiece | undefined;
  /** 持っているピース。 */
  get holdPiece(): JigsawPiece | undefined {
    return this._holdPiece;
  }
  /** 持っているピース。 */
  set holdPiece(piece: JigsawPiece | undefined) {
    let scene = GameMaster.this.scene;
    this.active = true;
    this.deactivate = false;

    if(this.releaseEvent != undefined && !this.releaseEvent.destroyed()) {
      GameMaster.this.scene.clearTimeout(this.releaseEvent);
    }

    if(this._holdPiece != undefined) {
      this._holdPiece.changeView(false);
    }

    this._holdPiece = piece;

    if(this._holdPiece == undefined) return;

    // ピースを一定時間後に離す
    this.releaseEvent = scene.setTimeout(() => this.releasePiece(), 10000);
  }

  /** ピースを一定時間後に離す。 */
  releasePiece(): void {
    if(this._holdPiece == undefined) return;
    this._holdPiece.raiseUpEvent();
  }

  /** ピースを離すイベント。 */
  releaseEvent: g.TimerIdentifier | undefined;


  /**
   * `MyPlayer` クラスの初期化。
   */
  static init(scene: g.Scene): void {
    this.deactivateEvent = scene.setInterval(this.deactivating, this.activeTime*1000, this);
  }


  private constructor(nicoId: string | undefined, playerId: number, name: string) {
    this.nicoId = nicoId;
    this.playerId = playerId;
    this.ID = playerId;
    this.BAN = false;
    this.name = name;
    this.score = 0;
    this.rank = 0;
    this.cursorPos = {x: 0, y: 0};
    this._holdPiece = undefined;
    this.nameFont = new g.DynamicFont({
      game: g.game,
      fontFamily: "sans-serif",
      size: 30,
    });
    this.nameDisplay = new g.FilledRect({
      scene: GameMaster.this.scene,
      cssColor: "rgba(255,255,255,128)",
      width: 0,
      height: 40,
      hidden: true,
      local: true,
    });
    this.nameLabel = new Label({
      scene: GameMaster.this.scene,
      width: 0,
      height: 40,
      font: this.nameFont,
      text: `${this.name}#${this.ID}`,
      widthAutoAdjust: true,
      lineBreak: false,
      local: true,
      parent: this.nameDisplay,
    });
    this.nameDisplay.width = this.nameLabel.width;
    this.nameDisplay.modified();
  }

  /**
   * 新規プレイヤーの作成。
   * グローバル。
   */
  static newPlayer(nicoId: string | undefined, name: string): MyPlayer {
    let playerId = this.count++;
  
    // このプレイヤーが新規か、別デバイスからの参加かを調べる
    let p = this.searchNicoId(nicoId);
    if(p == undefined) {
      // 本当の新規プレイヤー
      p = new MyPlayer(nicoId, playerId, name);
      this.players.push(p);
      this.calcRank();
    } else {
      // 別デバイスからの参加
      p.playerId = playerId;
      p.name = name;
      p.nameLabel.text = `${p.name}#${p.ID}`;
      p.nameLabel.invalidate();
      p.nameDisplay.width = p.nameLabel.width;
      p.nameDisplay.modified();
      JigsawPiece.changeUpdateCnt();
    }

    // 端末のローカルプレイヤーIDを設定
    if(this.localPlayerId == undefined && this.localPlayerPlaying)
      if(p.nicoId == g.game.selfId)
        this.localPlayerId = p.playerId;

    // ==================== ホストプレイヤーを設定 ====================
    // 生主が設定されてる かつ この参加プレイヤーが生主
    if(this.liverId != undefined && this.liverId == nicoId) {
      this.hostPlayerId = p.playerId;
      this.changeHost(p);
    } else
    // 生主が設定されてない かつ ホストがまだ存在しない
    if(this.liverId == undefined && this.hostPlayerId == undefined) {
      this.hostPlayerId = p.playerId;
      this.changeHost(p);
    }
    return p;
  }

  /**
   * スコアアップ。
   */
  scoreUp(score: number) {
    this.score += score;
    MyPlayer.calcRank();
  }

  /**
   * プレイヤー名を表示。
   */
  showName(layer: g.E | g.Scene): void {
    if(this.nameHideEvent != undefined && !this.nameHideEvent.destroyed()) {
      this.nameHideEvent.destroy();
    }
    layer.append(this.nameDisplay);
    this.nameDisplay.show();
  }

  /**
   * プレイヤー名を移動。
   */
  moveName(point: Point) {
    this.nameDisplay.moveTo(point.x, point.y);
    this.nameDisplay.modified();
  }

  /**
   * プレイヤー名を非表示。
   */
  hideName(): void {
    this.nameHideEvent = GameMaster.this.scene.setTimeout(() => {
      this.nameDisplay.hide();
    }, 1000);
  }

  /**
   * 全員のランクを計算する。  
   * 新規プレイヤー参加 or 誰かのスコア変化 or で呼ばれる。
   */
  static calcRank(): void {
    MyPlayer.players.sort((a, b) => b.score - a.score);
    let score = 999999;
    let rank = 0;
    let skip = 1;
    for(let p of MyPlayer.players) {
      if(p.score == score) {
        p.rank = rank;
        skip++;
      } else {
        rank += skip;
        p.rank = rank;
        skip = 1;
        score = p.score;
      }
    }
  }

  /**
   * プレイヤーのアクティビティを変更するイベント。
   */
  private static deactivating(): void {
    if(GameMaster.this.gameStatus != "palying") return;
    for(let p of this.players) {
      p.active = !p.deactivate;
      p.deactivate = true;
    }
    JigsawPiece.changeUpdateCnt();
  }

  /**
   * ホストプレイヤーが変更された時実行。
   */
  private static changeHost(p: MyPlayer): void {
    for(let ch of this.changeHostEvent) {
      ch(p);
    }
  }

  /**
   * プレイヤーIDがこの端末のプレイヤーIDかどうか。
   */
  static isSelf(playerId?: number): boolean {
    if(playerId == undefined) return false;
    return MyPlayer.localPlayerId == playerId;
  }

  /**
   * この端末のプレイヤーがホストかどうか。
   */
  static isHost(): boolean {
    let hostId = MyPlayer.hostPlayerId;
    /* ・この端末の、ローカルプレイヤーIDが存在する
     * ・ホストIDがローカルプレイヤーID
     */
    return MyPlayer.localPlayerId != undefined && MyPlayer.isSelf(hostId);
  }

  /**
   * この端末のプレイヤーを取得する。
   */
  static self(): MyPlayer | undefined {
    if(this.localPlayerId == undefined) return undefined;
    return this.searchPlayerId(this.localPlayerId);
  }

  /**
   * 特定のピースを持っているプレイヤーを探す。  
   * 本当はあり得ないが、複数人が同じピースを持っている可能性がある。
   */
  static searchHoldPiece(piece: JigsawPiece): MyPlayer {
    for(let p of MyPlayer.players) {
      if(p.holdPiece != undefined && p.holdPiece.pieceId == piece.pieceId) return p;
    }
  }

  /**
   * `nicoId` からプレイヤーを検索する。  
   * @param nicoId 検索するニコニコID。`undefined` なら `undifined` を返す。
   */
  static searchNicoId(nicoId: string | undefined): MyPlayer | undefined {
    if(nicoId == undefined) return undefined;
    for(let p of this.players) {
      if(p.nicoId == nicoId) return p;
    }
    return undefined;
  }

  /**
   * `playerId` からプレイヤーを検索する。
   */
  static searchPlayerId(playerId: number): MyPlayer | undefined {
    for(let p of this.players) {
      if(p.playerId == playerId) return p;
    }
    return undefined;
  }
}