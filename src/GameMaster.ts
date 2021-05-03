import { resolvePlayerInfo } from "@akashic-extension/resolve-player-info";
import { Animation } from "./Animation";
import { JigsawPazzle } from "./JigsawPazzle";
import { JigsawPiece } from "./JigsawPiece";
import { ClearEventData, ConnectPieceEventData, FitPieceEventData, JoinEventData, MEDataBase, MEDataPiece, PieceDownEventData, PieceMoveEventData, PieceUpEventData } from "./MyEventData";
import { MyPlayer } from "./MyPlayer";
import { MySound } from "./MySound";
import { PazzleAssets } from "./PazzleAssets";
import { PlayingInfo } from "./PlayingInfo";
import { Result } from "./Result";
import { spriteSet, Title } from "./Title";
import { ClearData, Point } from "./Tuples";

/**
 * このクラスがゲームの中心になる。  
 * シングルトン。
 */
export class GameMaster {
  /** ゲームマスター自身。 */
  static this: GameMaster;
  /** ゲームで使う唯一のシーン。 */
  scene: g.Scene;
  /** アセット。 */
  get assets(): PazzleAssets {
    return PazzleAssets.this;
  }
  /** タイトル画面。 */
  title: Title;
  /** アニメーション。 */
  private _animation: Animation;

  /** ゲームの状態 */
  gameStatus: "title" | "palying" | "clear" = "title";
  /** ゲームの情報更新を測る */
  private _updateTick: number = 0;
  /** 背景色。 */
  private _colors: string[] = [
    "#0087CC", "#A900CC", "#CC4300", "#22CC00",
    "#3D738E", "#813D8E", "#8E583D", "#4A8E3D"
  ];
  /** 選択中の背景色インデックス。 */
  private colorId: number = 0;
  /** 正しい背景色IDに。 */
  private getId(id: number): number {
    return (id+this._colors.length) % this._colors.length;
  }
  /** 背景色取得。 */
  private getColor(id: number): string {
    return this._colors[this.getId(id)];
  }
  /** 選択背景色をインクリメント。 */
  private nextColor(): void {
    this.colorId = this.getId(this.colorId+1);
  }

  /** プレイ中のパズルの情報。 */
  get playingInfo(): PlayingInfo {
    return PlayingInfo.this;
  }

  /** プレイ中のジグソーパズルを入れる。 */
  playingPzl: JigsawPazzle | undefined;

  // =============================== レイヤー ===============================
  /**
   * パズルを表示するレイヤー。  
   * 中はボードレイヤーとピースレイヤーがある。
   */
  pazzleLayer: g.E;
  /** コントロールを表示するレイヤー。 */
  uiLayer: g.E;
  /** タイトル画面のUI。 */
  private titleUiLayer: g.E;
  /** プレイ画面のUI。 */
  private playingUiLayer: g.E;
  /** プレビュー画像を表示するレイヤー。 */
  private previewLayer: g.E;

  // ========================== `pazzleLayer` の中身 ==========================
  /** 一番うしろ。背景。 */
  private backEntity: g.FilledRect;
  // ========================== `playingUiLayer` の中身 ==========================
  /** タイトルに戻るボタン。 */
  private goTitle: g.E;

  /** ゲーム画面を動かすカメラ。 */
  camera: g.Camera2D;

  /** 背景色変更ボタン。 */
  colorChangeBtn: g.FilledRect;
  /** 拡大ボタン。 */
  zoomInBtn: g.Sprite;
  /** 縮小ボタン。 */
  zoomOutBtn: g.Sprite;
  /** プレビューボタン。 */
  previewBtn: g.Sprite;
  /** リザルトボタン。 */
  resultBtn: g.Sprite;

  private constructor(scene: g.Scene) {
    GameMaster.this = this;
    this.scene = scene;
    PazzleAssets.create();
    MySound.create();
    PlayingInfo.create();
    Result.create();
    this._animation = new Animation(scene);

    this.title = Title.create();
    MyPlayer.init(scene);
    MyPlayer.changeHostEvent.push(host => {
      this.title.changeHostUI();
    });

    // ====================== レイヤー生成 ======================
    this.pazzleLayer = new g.E({
      scene,
      width: g.game.width,
      height: g.game.height,
      local: true,
      anchorX: null,
    });
    this.uiLayer = new g.E({
      scene,
      width: g.game.width,
      height: g.game.height,
      local: true,
      anchorX: null,
    });
    this.titleUiLayer = new g.E({
      scene,
      width: g.game.width,
      height: g.game.height,
      local: true,
      parent: this.uiLayer,
    });
    this.playingUiLayer = new g.E({
      scene,
      width: g.game.width,
      height: g.game.height,
      local: true,
      parent: this.uiLayer,
      hidden: true,
    });
    this.previewLayer = new g.FilledRect({
      scene,
      cssColor: "rgba(0,0,0,0.5)",
      width: 860,
      height: 540,
      x: 55, y: 37,
      parent: this.uiLayer,
      local: true,
      touchable: true,
      hidden: true,
    });
    // // イベント  プレビュークリックでプレビュー入れ替え
    // this.previewLayer.onPointDown.add(ev => {
    // });
    // レイヤーは追加する順番が大事
    this.scene.append(this.pazzleLayer);
    this.scene.append(this.uiLayer);

    // 背景生成
    this.backEntity = new g.FilledRect({
      scene,
      cssColor: this.getColor(0),
      width: g.game.width,
      height: g.game.height,
      parent: this.pazzleLayer,
      anchorX: null,
      local: true,
      touchable: true,
      hidden: true,
    });

    // =================================== UIコントロールを追加 ===================================
    this.playingUiLayer.append(this.playingInfo.display);
    let controlBack = new g.FilledRect({
      scene,
      cssColor: "rgba(255,255,255,0.4)",
      width: 560,
      height: 100,
      x: 300, y: 600,
      parent: this.playingUiLayer,
      local: true,
    });
    // 背景色変更ボタン
    this.colorChangeBtn = new g.FilledRect({
      scene,
      x: 10, y: 10,
      width: 80, height: 80,
      cssColor: this.getColor(1),
      parent: controlBack,
      touchable: true,
      local: true,
    });
    // 縮小ボタン
    this.zoomOutBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("zoomOut"),
      x: this.colorChangeBtn.x + 110, y: 0,
      parent: controlBack,
      touchable: true,
      local: true,
    });
    // 拡大ボタン
    this.zoomInBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("zoomIn"),
      x: this.zoomOutBtn.x + 110, y: 0,
      parent: controlBack,
      touchable: true,
      local: true,
    });
    // プレビューボタン
    this.previewBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("previewBtn"),
      x: this.zoomInBtn.x + 110, y: 0,
      parent: controlBack,
      touchable: true,
      local: true,
    });
    // リザルトボタン
    this.resultBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("resultBtn"),
      x: this.previewBtn.x + 110, y: 0,
      parent: controlBack,
      touchable: true,
      local: true,
      hidden: true,
    });

    // タイトルに戻るボタン
    this.goTitle = new g.Sprite({
      scene: this.scene,
      src: this.scene.asset.getImageById("titleBtn"),
      x: 960, y: 600,
      touchable: true,
    });

    this.playingUiLayer.append(Result.this.display);
    this.playingUiLayer.append(this._animation.display);

    // ========================= イベントを追加 =========================
    // 背景色を変える
    this.colorChangeBtn.onPointDown.add(ev => {
      this.nextColor();
      this.backEntity.cssColor = this.getColor(this.colorId);
      this.backEntity.modified();
      this.colorChangeBtn.cssColor = this.getColor(this.colorId+1);
      this.colorChangeBtn.modified();
    });
    // 画面を拡大する
    this.zoomInBtn.onPointDown.add(this.zoomIn, this);
    // 画面を縮小する
    this.zoomOutBtn.onPointDown.add(this.zoomOut, this);
    // プレビュー表示・非表示
    this.previewBtn.onPointDown.add(ev => {
      if(this.previewLayer.visible())
        this.previewLayer.hide();
      else {
        this.previewLayer.show();
      }
    });
    // リザルト表示
    this.resultBtn.onPointDown.add(ev => {
      if(Result.this.display.visible())
      Result.this.hide();
      else {
        this.previewLayer.hide();
        Result.this.show();
      }
    });
    // タイトルに戻る
    this.goTitle.onPointDown.add(ev => {
      // 初期化
      this.gameStatus = "title";
      this._animation.stop();

      for(let p of MyPlayer.players)
        p.score = 0;

      this.playingPzl.masterLayer.remove();
      this.playingPzl = undefined;

      this.title.displayE.show();
      this.title.changePreview(0);
      // this.title.joinChange(MyPlayer.playerCnt);
      this.previewLayer.hide();
      this.backEntity.hide();


      this.camera.moveTo(0, 0);
      this.camera.scale(1);
      this.cameraModified();

      this.playingUiLayer.hide();
      this.resultBtn.hide();
      // ホストならタイトルに戻るボタンを見えなくする。
      if(MyPlayer.isHost()) {
        this.goTitle.remove();
      }
      this.titleUiLayer.show();
      Result.this.init();
    });

    // カメラを設定
    this.camera = new g.Camera2D({
      width: g.game.width,
      height: g.game.height,
      anchorX: null,
      local: true,
    });
    g.game.focusingCamera = this.camera;
    this.cameraModified();

    // ================== レイヤーにエンティティの登録 ==================
    // タイトル画面
    // this.pazzleLayer.append(this.title.displayE);
    this.titleUiLayer.append(this.title.displayE);
    // 参加ボタンとガード
    let guard = new g.FilledRect({
      scene,
      cssColor: "rgba(0,0,0,0)",
      width: g.game.width,
      height: g.game.height,
      local: true,
      touchable: true,
    });
    let joinBtn = new g.Sprite({
      scene,
      src: scene.asset.getImageById("joinBtn"),
      x: 50, y: 600,
      local: true,
      parent: guard,
      touchable: true,
    });
    this.uiLayer.insertBefore(guard, this.playingUiLayer);
    guard.onPointMove.add(this.moveCameraEvent, this);
    joinBtn.onPointDown.add(ev => {
      if(g.game.isSkipping) return;

      this.join();
      guard.destroy();
    });

    // ====================== イベント登録 ======================
    scene.onMessage.add(ev => {
      let me = ev.data as MEDataBase;
      switch (me.id) {
        // プレイヤー参加イベント
        case JoinEventData.ID:
          this.playerJoinEvent(me as JoinEventData);
          this.title.joinChange(MyPlayer.actPlayerCnt);
          break;
        // クリアイベント
        case ClearEventData.ID:
          let data = me as ClearEventData;
          this.clear(data);
          break;
      }
    });
    // ボード・ピースに対してのイベント
    scene.onMessage.add(this.boardEvent, this);
    scene.onMessage.add(this.conFitEvent, this);
    // 毎フレーム処理する
    scene.onUpdate.add(this.updatePlaying, this);
    // 画面を掴んで移動する
    this.backEntity.onPointMove.add(this.moveCameraEvent, this);
    // ピースを掴んだまま画面を移動する
    this.scene.onUpdate.add(this.moveWhileHoldEvent, this);
  }

  /**
   * ゲームプレイ中のみ毎フレーム実行する。
   */
  private updatePlaying() {
    if(g.game.isSkipping) return;
    if(this._updateTick++ != g.game.fps) return;
    this._updateTick = 0;
    if(this.gameStatus != "palying") return;
    this.playingInfo.update();
  }

  /**
   * ゲームを作る。
   */
  static createGame(scene: g.Scene): GameMaster {
    if(GameMaster.this != undefined) return this.this;
    new GameMaster(scene);

    return this.this;
  }

  /**
   * ゲームに参加するボタンを押した時。  
   * ローカル。
   */
  join() {
    /* プレイヤーのニコニコアカウント名を取得する。
     * https://akashic-games.github.io/shin-ichiba/player-info.html
     * 
     * resolvePlayerInfo(opts:{raises?, limitSeconds?}, callback?);
     * `raises: true` の場合 `g.game.onPlayerInfo` が呼ばれる。
     */
    resolvePlayerInfo({limitSeconds: 30}, (err, pi) => {
      if(!pi) return;
      if(!pi.name) return;

      // // ユーザー名が自動所得だった場合に名前を決める。
      // if(!pi.userData.accepted) {
      //   pi.name = `あいうえおかきくけこさしすさしす ${Math.floor(Math.random()*100)}`;
      // }

      // プレイヤー参加イベントデータ
      let data: JoinEventData = {
        id: 0,
        nicoId: g.game.selfId,
        name: pi.name,
      };

      MyPlayer.localPlayerPlaying = true;
      // グローバルなプレイヤー参加イベントを呼び出す。
      g.game.raiseEvent(new g.MessageEvent(data));
    });
  }

  /**
   * ゲーム開始。
   */
  start(): void {
    // これいる？
    Result.this.rankingChange(MyPlayer.players[0], MyPlayer.players);

    this.gameStatus = "palying";

    // let pzl = new JigsawPazzle(0, {
    //   image: this.assets.pazzleAssets[this.title.sellectPzlId].previewSrc,
    //   wakus: this.assets.wakus,
    //   size: { w: 150, h: 150 },
    //   colRol: { col: 100, row: 100 },
    //   center: {x: 0, y: 0},
    // });
    let pzl = new JigsawPazzle(this.title.sellectPzlId, this.title.cutParam);

    this.playingPzl = pzl;
    this.pazzleLayer.append(pzl.masterLayer);

    this.camera.scale((pzl.preview.width+pzl.preview.height)/500);
    this.camera.moveTo(pzl.margin.w*1.7, pzl.margin.h*1.4);
    this.cameraModified();

    this.backEntity.show();
    this.playingUiLayer.show();
    this.titleUiLayer.hide();

    this.playingInfo.changePzl();

    // プレビューボタンを押した時のプレビューを初期化
    if(this.previewLayer.children != undefined) {
      for(let c of this.previewLayer.children) {
        this.previewLayer.remove(c);
      }
    }

    // プレビュー画像を追加する
    this.previewLayer.append(pzl.preview);
    spriteSet(pzl.preview, this.previewLayer.width, this.previewLayer.height);
  }

  /**
   * パズルが完成した。
   * @param pzl 完成したパズル
   */
  clearPazzle(pzl: JigsawPazzle): void {
    // ホストなら、クリアイベントを送りつける
    if(!MyPlayer.isHost()) return;

    let datas: ClearData[] = new Array();
    for(let p of MyPlayer.players) {
      datas.push({
        playerId: p.playerId,
        score: p.score
      });
    }
    let data: ClearEventData = {
      id: ClearEventData.ID,
      players: datas,
      lastPlayerId: pzl.lastPlayer.playerId,
    };
    g.game.raiseEvent(new g.MessageEvent(data));
  }

  /**
   * 全てのパズルが完成した。  
   * クリア。
   */
  clear(data: ClearEventData): void {
    this.gameStatus = "clear";
    this.playingPzl.stopWatch.stop();
    this.previewLayer.hide();
    // 情報がズレているかも知れないので、情報を修正する
    this.playingPzl.fittedPieceCount = this.playingPzl.pieceCount;
    this.playingPzl.lastPlayer = MyPlayer.searchPlayerId(data.lastPlayerId);

    for(let pd of data.players) {
      let p = MyPlayer.searchPlayerId(pd.playerId);
      p.score = pd.score;
      p.holdPiece = undefined;
      if(p.releaseEvent != undefined && !p.releaseEvent.destroyed()) {
        this.scene.clearTimeout(p.releaseEvent);
      }
    }
    for(let piece of this.playingPzl.pieces) {
      if(!piece.fitted) {
        piece.fitPiece(false);
        // `if(!piece.fitted)` が無ければ要る
        // pzl.boardLayer.append(piece.piece);
      }
    }
    MyPlayer.calcRank();

    this._animation.start();
    this.playingInfo.update();
    this.previewLayer.hide();
    this.resultBtn.show();
    Result.this.show();

    // リザルト
    Result.this.rankingChange(this.playingPzl.lastPlayer, MyPlayer.players);

    // ホストプレイヤーにだけタイトルに戻るボタンを表示する
    if(MyPlayer.isHost()) {
      this.playingUiLayer.insertBefore(this.goTitle, this._animation.display);
    }
  }

  /**
   * ボード・ピースに対してのイベント。  
   * `ev.data` は `MEDataBase` を継承したクラス。
   * 
   * イベントを実行したプレイヤーはここでは何もしない。  
   * そのため、ここでイベント実行以外のローカルな処理は書かないこと。
   */
   private boardEvent(ev: g.MessageEvent) {
    if(this.gameStatus != "palying") return;

    let mep = ev.data as MEDataPiece;
    // ピースの位置を同期するために、
    // 最後のイベント `PiceUpEvent` で、ピースの座標を指定し、確定させる
    // こうしないと、操作プレイヤーがリロードすると、操作前の位置に戻ってしまう

    // 呼び出したのが自分なら、何もしない
    // 自分の場合ローカルですでに処理してるからね

    switch (mep.id) {
      // ピース持ち上げイベント
      case PieceDownEventData.ID:
        if(MyPlayer.isSelf(mep.playerId)) return;
        let down = mep as PieceDownEventData;
        
        this.playingPzl.pieces[down.pieceId].downEvent(down);
        break;
      // ピース移動イベント
      case PieceMoveEventData.ID:
        if(MyPlayer.isSelf(mep.playerId)) return;
        let move = mep as PieceMoveEventData;
        this.playingPzl.pieces[move.pieceId].moveEvent(move);
        break;
      // ピースを離すイベント
      case PieceUpEventData.ID:
        let up = mep as PieceUpEventData;
        this.playingPzl.pieces[up.pieceId].upEvent(up);
        break;
    }
  }

  /**
   * ピースがくっついた／ハマった時のイベント。
   */
  private conFitEvent(ev: g.MessageEvent) {
    if(this.gameStatus != "palying") return;

    let me = ev.data as MEDataBase;
    let player: MyPlayer;

    switch(me.id) {
      // ピースがくっついたイベント
      case ConnectPieceEventData.ID:
        let con = me as ConnectPieceEventData;
        player = MyPlayer.searchPlayerId(con.playerId);
        
        let ownP = this.playingPzl.pieces[con.ownerPieceId];
        let chiP = this.playingPzl.pieces[con.childPieceId];
        ownP.connectPiece(MyPlayer.isSelf(player.playerId), chiP);

        if(MyPlayer.self() != undefined) {
          let holdP = MyPlayer.self().holdPiece;
          if(chiP == holdP) {
            if(chiP.pieceId == holdP.pieceId) {
              // ピースを離したイベント
              chiP.raiseUpEvent();
            }
          }
        }
        player.scoreUp(1);
        break;
      // ピースがハマったイベント
      case FitPieceEventData.ID:
        let fit = me as FitPieceEventData;
        player = MyPlayer.searchPlayerId(fit.playerId);

        let piece = this.playingPzl.pieces[fit.pieceId];
        piece.fitPiece(MyPlayer.isSelf(player.playerId));
        this.playingPzl.boardLayer.append(piece.piece);

        if(piece.children != undefined) {
          for(let c of piece.children) {
            c.changeView(false);
          }
        }

        // ハマったピースの枚数を更新
        this.playingPzl.fittedPieceCount++;
        if(piece.children != undefined) {
          this.playingPzl.fittedPieceCount += piece.children.length;
        }

        player.scoreUp(1);

        // パズルをクリアしたかを調べる。
        this.playingPzl.clearCheck(player);
        break;
    }
  }

  /**
   * 画面を掴んでカメラを移動する。  
   * タイトル画面なら動かさない。
   */
  moveCameraEvent(ev: g.PointMoveEvent): void {
    if(this.gameStatus == "title") return;
    this.moveCamera(ev.prevDelta);
  }

  /**
   * ピースを掴んだまま画面を動かす。  
   * タイトル画面なら動かさない。
   */
   private moveWhileHoldEvent(): void {
    if(this.gameStatus == "title") return;
    if(MyPlayer.self() == undefined) return;

    let piece = MyPlayer.self().holdPiece;
    // ピースを持っていない
    if(piece == undefined) return;
    // ピースが５つ以上の塊
    if(piece.children != undefined && piece.children.length >= 4) return;
    console.log(piece.owner);

    // 画面上のポイント座標を計算
    // 左上座標
    let pos_hu = this.playingPzl.pieceLayer.localToGlobal(piece.piece);
    pos_hu = this.backEntity.globalToLocal(pos_hu);
    // 右下座標
    let pos_ms = {
      x: pos_hu.x + piece.piece.width / this.camera.scaleX,
      y: pos_hu.y + piece.piece.height / this.camera.scaleY,
    }

    // 移動量（割合）
    let dist = { x: 0, y: 0 };
    // 移動量（最大値）
    let power = 10 * (this.camera.scaleX+3);
    if(power > 50) power = 50;
    
    // 移動範囲
    let range_x = 20 * this.camera.scaleX;
    let range_y = 20 * this.camera.scaleY;
    if(pos_hu.x < range_x) {
      if(pos_hu.x < 0) dist.x = 1;
      else dist.x = 1 - Math.sqrt(pos_hu.x / range_x);
    } else if(pos_ms.x > g.game.width - range_x) {
      if(pos_ms.x > g.game.width) dist.x = -1;
      else dist.x = Math.sqrt((g.game.width - pos_ms.x) / range_x)-1;
    }
    if(pos_hu.y < range_y) {
      if(pos_hu.y < 0) dist.y = 1;
      else dist.y = 1 - Math.sqrt(pos_hu.y / range_y);
    } else if(pos_ms.y > g.game.height - range_y) {
      if(pos_ms.y > g.game.height) dist.y = -1;
      else dist.y = Math.sqrt((g.game.height - pos_ms.y) / range_y)-1;
    }
    if(dist.x == 0 && dist.y == 0) return;

    let move = {
      x: power * dist.x,
      y: power * dist.y,
    }

    this.moveCamera(move);
    piece.downPos.x -= move.x * this.camera.scaleX;
    piece.downPos.y -= move.y * this.camera.scaleY;
    piece.onPointMoveP(new g.PointMoveEvent(
      0, piece.piece,
      {x: 0, y: 0},
      {x: 0, y: 0},
      piece.lastDelta
    ));
  }

  /**
   * カメラを動かす。
   */
  private moveCamera(point: Point): void {
    this.camera.x += -point.x * this.camera.scaleX;
    this.camera.y += -point.y * this.camera.scaleY;

    // カメラのサイズの半分
    const cameraHW = this.camera.width  /2;
    const cameraHH = this.camera.height /2;
    // 移動後のカメラの中心座標
    const movedX = this.camera.x + cameraHW;
    const movedY = this.camera.y + cameraHH;

    // カメラの移動制限
    if(movedX < 0 || isNaN(movedX)) {
      this.camera.x = -cameraHW;
    } else if(movedX > this.playingPzl.pazzleSize.w) {
      this.camera.x = this.playingPzl.pazzleSize.w - cameraHW;
    }
    if(movedY < 0 || isNaN(movedY)) {
      this.camera.y = -cameraHH;
    } else if(movedY > this.playingPzl.pazzleSize.h) {
      this.camera.y = this.playingPzl.pazzleSize.h - cameraHH;
    }

    this.cameraModified();
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
    
    // `uiLayer` の調整
    this.uiLayer.moveTo(this.camera.x, this.camera.y);
    this.uiLayer.scaleX = this.camera.scaleX;
    this.uiLayer.scaleY = this.camera.scaleY;
    this.uiLayer.modified();
    // 背景も
    this.backEntity.moveTo(this.camera.x, this.camera.y);
    this.backEntity.scaleX = this.camera.scaleX;
    this.backEntity.scaleY = this.camera.scaleY;
    this.backEntity.modified();
  }

  // ============================= グローバルイベント =============================
  /**
   * プレイヤー参加イベント。
   */
  playerJoinEvent(ev: JoinEventData) {
    let p = MyPlayer.newPlayer(ev.nicoId, ev.name);
  }
}