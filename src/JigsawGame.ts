import { JigsawPazzle } from "./JigsawPazzle";
import { JigsawPiece } from "./JigsawPiece";
import { MEDataBase, PieceDownEventData, PieceMoveEventData, PieceUpEventData } from "./MyEventData";
import { PazzleAssets } from "./PazzleAsset";
import { MyPlayer } from "./MyPlayer";
import { spriteSet } from "./PazzlePreview";

/**
 * 全ジグソーパズルを管理するシングルトンなクラス。
 * 
 * 各パズルはお互いに干渉せず、ピースの移動範囲も各ボード内に制限される。
 */
export class JigsawGame {
  /** たった１つだけ存在する `JigsawGame` のインスタンス。 */
  static this: JigsawGame;
  /** 拡大ボタン。 */
  zoomInBtn: g.Sprite;
  /** 縮小ボタン。 */
  zoomOutBtn: g.Sprite;
  /** プレビューボタン。 */
  previewBtn: g.Sprite;
  // /** 設定ボタン。現在未実装です */
  // private _settingBtn: g.Sprite;

  /** ゲームが始まっているかどうか。 */
  playing: boolean = false;
  /** プレビューしているパズルの番号。 */
  previewId: number = 0;

  /**
   * プレイヤーのカメラ。  
   * ローカルエンティティ。
   */
  camera: g.Camera2D;

  /** UIレイヤー。 */
  uiLayer: g.E;
  /** 各パズルのボードとピースを表示するレイヤー。 */
  pazzleLayer: g.E;
  // /** 設定レイヤー。 */
  // settingLayer: g.E;
  /** プレビューレイヤー。 */
  previewLayer: g.E;

  /** プレイヤーの配列。 */
  players: MyPlayer[];
  /** プレイ中のパズル。 */
  playingPazzles: JigsawPazzle[];
  /** パズルのアセット。 */
  assets: PazzleAssets;

  /**
   * シングルトンクラスなのでコンストラクタはプライベート。
   */
  private constructor(assets: PazzleAssets) {
    this.players = new Array();
    this.playingPazzles = new Array();
    this.assets = assets;
    // レイヤー。まだゲームは始まってないので非表示。
    this.uiLayer = new g.E({
      scene: assets.scene,
      width: g.game.width,
      height: g.game.height,
      local: true,
      anchorX: null,
      hidden: true,
    });
    this.pazzleLayer = new g.E({
      scene: assets.scene,
      local: true,
      hidden: true,
    });
    this.previewLayer = new g.FilledRect({
      scene: assets.scene,
      cssColor: "rgba(0,0,0,0.7)",
      x: 100,
      y: 50,
      width: 1080,
      height: 620,
      local: true,
      hidden: true,
      parent: this.uiLayer,
      touchable: true,
    });
    // プレビューボタンクリックで入れ替える
    this.previewLayer.onPointDown.add(ev => {
      if(this.previewLayer.children == undefined ||
         this.previewLayer.children[0] == undefined ) return;
      this.previewId = (this.previewId+1) % this.playingPazzles.length;
      var pre = this.previewLayer.children[0] as g.Sprite;
      pre.src = this.playingPazzles[this.previewId].preview.src;
      spriteSet(pre, this.previewLayer.width, this.previewLayer.height);
      pre.invalidate();
    });

    // 設定画面は現在未実装です
    // this.settingLayer = new g.FilledRect({
    //   scene: assets.scene,
    //   cssColor: "rgba(0,0,0,0.7)",
    //   x: 100,
    //   y: 50,
    //   width: 1080,
    //   height: 620,
    //   local: true,
    //   hidden: true,
    //   parent: this.uiLayer,
    //   touchable: true,
    // });
    // // 設定画面に追加する色々
    // var btn1 = new g.Sprite({
    //   scene: assets.scene,
    //   src: assets.scene.asset.getImageById("set1Btn"),
    //   x: this.settingLayer.width/2,
    //   y: 30,
    //   local: true,
    //   parent: this.settingLayer,
    //   touchable: true,
    // });
    // btn1.moveBy(-btn1.width/2, 0);
    // レイヤーをシーンに追加する（順番が大事）
    assets.scene.append(this.pazzleLayer);
    assets.scene.append(this.uiLayer);


    var scene = this.assets.scene;
    // カメラを設定
    var camera = new g.Camera2D({
      width: g.game.width,
      height: g.game.height,
      anchorX: null,
      local: true,
    });
    this.camera = camera;
    this.cameraModified();
    // =================================== UIコントロールを追加 ===================================
    // 縮小ボタン
    this.zoomOutBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("zoomOut"),
      x: 1190, y: 630,
      scaleX: 0.8, scaleY: 0.8,
      parent: this.uiLayer,
      touchable: true,
      local: true,
    });
    // 拡大ボタン
    this.zoomInBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("zoomIn"),
      x: this.zoomOutBtn.x,
      y: this.zoomOutBtn.y - 80,
      scaleX: 0.8, scaleY: 0.8,
      parent: this.uiLayer,
      touchable: true,
      local: true,
    });
    // プレビューボタン
    this.previewBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("previewBtn"),
      x: this.zoomInBtn.x,
      y: this.zoomInBtn.y - 80,
      scaleX: 0.8, scaleY: 0.8,
      parent: this.uiLayer,
      touchable: true,
      local: true,
    });

    // 設定画面は現在未実装です
    // // 設定ボタン
    // this._settingBtn = new g.Sprite({
    //   scene,
    //   src: scene.asset.getImageById("setting"),
    //   local: true,
    //   parent: this.uiLayer,
    //   touchable: true,
    // });
    // this._settingBtn.x = g.game.width-this._settingBtn.width;
    // this._settingBtn.y = g.game.height-this._settingBtn.height;

    // ========================= イベントを追加 =========================
    // 画面を拡大する
    this.zoomInBtn.onPointDown.add(this.zoomIn, this);
    // 画面を縮小する
    this.zoomOutBtn.onPointDown.add(this.zoomOut, this);
    // プレビュー画像を表示する   最初の1回目はプレビューエンティティを追加
    this.previewBtn.onPointDown.addOnce(ev => {
      var pre = new g.Sprite({
        scene,
        src: this.playingPazzles[0].preview.src,
        parent: this.previewLayer,
      });
      spriteSet(pre, this.previewLayer.width, this.previewLayer.height);
    });
    this.previewBtn.onPointDown.add(ev => {
      if(this.previewLayer.visible())
        this.previewLayer.hide();
      else
        this.previewLayer.show();
    });
    // 設定画面を表示
    // 設定画面は現在未実装です
    // this._settingBtn.onPointDown.add(ev => {
    //   if(this.settingLayer.visible())
    //     this.settingLayer.hide();
    //   else
    //   this.settingLayer.show();
    // });

  }

  /**
   * このクラスを生成する関数。  
   * `gameStart()` を実行するまではゲームは遊べない。
   */
  static create(assets: PazzleAssets): JigsawGame {
    if (JigsawGame.this) {
      throw Error("すでに `JigsawGame` は存在します。");
    }
    JigsawGame.this = new JigsawGame(assets);
    return JigsawGame.this;
  }

  /**
   * プレイヤー名を取得。  
   * なければ `undefined`
   * @param pId 取得するプレイヤーID。指定しなければこのプレイヤーIDになる。
   */
  static getName(pId?: string): string | undefined {
    if(!pId) pId = g.game.selfId;
    var plyaer = this.this.searchPlayer(pId);
    if(!plyaer) return undefined;
    return plyaer.name;
  }

  /**
   * ゲームを開始する時に呼ぶ。
   */
  gameStart() {
    this.playing = true;

    // レイヤーを表示する
    this.uiLayer.show();
    this.pazzleLayer.show();

    // カメラを設定
    g.game.focusingCamera = this.camera;
    var pzl = this.playingPazzles[0];
    this.camera.moveTo(pzl.margin.w, pzl.margin.h);
    this.camera.scale((pzl.boardLayer.width+pzl.boardLayer.height)/750);
    this.cameraModified();

    // 画面を掴んで移動する
    this.uiLayer.scene.onPointMoveCapture.add(this.gameOnPointMove, this);
    // ボード・ピースに対してのイベント
    this.uiLayer.scene.onMessage.add(this.boardEvent, this);
  }

  /**
   * プレイヤーがゲームに参加したら呼ばれる。
   * グローバル。
   */
  join(player: MyPlayer): void {
    this.players.push(player);
  }

  /**
   * 新しいパズルを追加する。
   * @param pazzleId 追加するジグソーパズルのID
   */
  addPazzle(pazzleId: number) {
    // 新しいパズルを生成
    var pazzle = new JigsawPazzle(this.assets.scene, this.assets.pazzles[pazzleId]);
    this.playingPazzles.push(pazzle);
    this.pazzleLayer.append(pazzle.masterLayer);
  }

  /**
   * 選択したパズルを削除する。
   * @param pazzleId 削除するジグソーパズルのID。指定しなければ全て。
   */
  removePazzle(pazzleId?: number) {
    if(pazzleId == undefined) {
      for(var pzl of this.playingPazzles)
        pzl.masterLayer.remove();
      this.playingPazzles = new Array();
      return;
    }
    for(var pId=0; pId<this.playingPazzles.length; pId++) {
      if(this.playingPazzles[pId].pazzleId == pazzleId) {
        this.playingPazzles[pId].masterLayer.remove();
        this.playingPazzles.splice(pId, 1);
      }
    }
  }

  /**
   * パズルIDからパズルを取得する。
   * @param pId 取得するパズルのID
   */
  getPazzle(pId: number): JigsawPazzle {
    for (var pzl of this.playingPazzles) {
      if (pzl.pazzleId != pId) continue;
      return pzl;
    }
    throw Error(`一致するパズルが見つかりませんでした。\npId ${pId}\nパズル一覧\n${this.playingPazzles}`);
  }
  /**
   * パズルID・ピースIDからピースを取得する。
   */
  getPiece(pzlId: number, picId: number): JigsawPiece {
    var pzl = this.getPazzle(pzlId);
    return pzl.pieces[picId];
  }

  /**
   * パズルが完成した時のイベント。
   * パズルが完成した `board` クラスから呼ばれる。
   * @param board 完成したボード
   */
  pazzleClear(board: JigsawPazzle) {
    // パズルは複数追加出来るが、今は実装してないので、
    // このメソッドが呼ばれる ＝ 全クリ

    var p = this.searchPlayer(g.game.selfId);
    if(p == undefined) return;
    if(!p.liver) return;
    // 生主なら、タイトルに戻るボタンを設置
    var titleBtn = new g.Sprite({
      scene: this.uiLayer.scene,
      src: this.uiLayer.scene.asset.getImageById("titleBtn"),
      y: 600,
      local: true,
      touchable: true,
      parent: this.uiLayer,
    });
    titleBtn.x = g.game.width/2 - titleBtn.width/2;

    titleBtn.onPointDown.add(ev => {
      titleBtn.destroy(true);
      g.game.raiseEvent(new g.MessageEvent({ message: "GT" }));
    });
  }

  /**
   * プレイヤーIDからプレイヤーを検索する。
   * @param pId 検索するプレイヤーID
   * @returns 一致するプレイヤー。存在しなければ `undefined`
   */
  searchPlayer(pId: string | undefined): MyPlayer | undefined {
    if(!pId) return undefined;
    for (var p of this.players) {
      if (p.id == pId) return p;
    }
    return undefined;
  }

  /**
   * 画面のどこかでクリックしたまま移動された時に呼ばれる。
   */
   gameOnPointMove(ev: g.PointMoveEvent) {
    // 操作プレイヤーが自分じゃない
    if (ev.player?.id != g.game.selfId) return;

    // 何か対象を操作した and ローカルイベント
    if (ev.target != undefined) {
      return;
    };
    this.moveCamera(ev);
  }

  /**
   * 画面を掴んで移動する。
   */
  moveCamera(ev: g.PointMoveEvent) {
    // カメラの移動
    this.camera.x += -ev.prevDelta.x * this.camera.scaleX;
    this.camera.y += -ev.prevDelta.y * this.camera.scaleY;

    this.cameraModified();
  }

  /**
   * ボード・ピースに対してのイベント。  
   * `ev.data` は `MEDataBase` を継承したクラス。
   * 
   * イベントを実行したプレイヤーはここでは何もしない。  
   * そのため、ここでイベント実行以外のローカルな処理は書かないこと。
   */
  private boardEvent(ev: g.MessageEvent) {
    var me = ev.data as MEDataBase;

    // 呼び出したのが自分なら何もしない
    if (me.playerId == g.game.selfId) return;

    switch (me.id) {
      case PieceDownEventData.ID:       // ピースクリックイベント
        var down = me as PieceDownEventData;
        this.getPiece(down.pazzleId, down.pieceId).downEvent(down);
        break;
      case PieceMoveEventData.ID:       // ピース移動イベント
        var move = me as PieceMoveEventData;
        this.getPiece(move.pazzleId, move.pieceId).moveEvent(move);
        break;
      case PieceUpEventData.ID:         // ピース離すイベント
        var up = me as PieceUpEventData;
        this.getPiece(up.pazzleId, up.pieceId).upEvent(up);
        break;
    }
  }


  /**
   * 画面を拡大する。
   */
  private zoomIn(ev: g.PointDownEvent) {
    if (!ev.player || !ev.player.id)
      return;
    // this.zoomBy(-0.1);
    this.zoomBy(0.9);
  }
  /**
   * 画面を縮小する。
   */
  private zoomOut(ev: g.PointDownEvent) {
    if (!ev.player || !ev.player.id)
      return;
    this.zoomBy(1.1);
  }

  private zoomBy(scale: number) {
    scale *= this.camera.scaleX;

    // 拡大率が 0.1 以下にならないように
    if(scale >= 0.1)
      this.camera.scale(scale);

    this.cameraModified();
  }

  /**
   * カメラの値を変更した後の処理。
   */
  private cameraModified() {
    // カメラの変更の反映
    this.camera.modified();
    g.game.modified();

    // localLayer の調整
    this.uiLayer.moveTo(this.camera.x, this.camera.y);
    this.uiLayer.scaleX = this.camera.scaleX;
    this.uiLayer.scaleY = this.camera.scaleY;
    this.uiLayer.modified();
  }
}
