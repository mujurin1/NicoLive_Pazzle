
import { GameMaster } from "./GameMaster";
import { JigsawPazzle } from "./JigsawPazzle";
import { ConnectPieceEventData, FitPieceEventData, PieceDownEventData, PieceMoveEventData, PieceUpEventData } from "./MyEventData";
import { MyPlayer } from "./MyPlayer";
import { MySound } from "./MySound";
import { PazzleAsset } from "./PazzleAsset";
import { PiecesParam } from "./PieceCut";
import { Point } from "./Tuples";


export class JigsawPiece {
  /** ピースのID。 */
  pieceId: number;
  /** 自分の所属するパズル。 */
  jigsaw: JigsawPazzle;
  /** 自分のピース画像。 */
  piece: g.Sprite;

  /** 自分が所属しているピース。 */
  owner: JigsawPiece | undefined;
  /** 自分に所属しているピース。 */
  children: JigsawPiece[] | undefined;

  /** 繋がるピースID。 */
  connect: number[];
  /** 完成した時のピースの座標。 */
  answerPosition: Point;

  /** ピースがボードにハマっているか。 */
  fitted: boolean = false;

  /** ピースの情報を更新する回数を間引くための値。 */
  static updateCnt: number;
  /** ピースの情報の更新回数を間引く数。 */
  static cutCnt: number = 2;

  // ピースを動かすための情報
  /** ピースをクリックした座標。 */
  downPos: Point;
  /** 最後の `startDelta` の値。 */
  lastDelta: Point = {x: 0, y: 0};

  /** パズルのアセット。 */
  get asset(): PazzleAsset {
    return this.jigsaw.asset;
  }
  /**
   * ピースの座標を返す。
   */
  get position(): Point {
    if (!this.owner) {
      return { x: this.piece.x, y: this.piece.y };
    } else {
      let disPx = this.owner.justPxBw(this);
      let ownPos = this.owner.position;
      return {
        x: ownPos.x + disPx.x,
        y: ownPos.y + disPx.y
      };
    }
  }

  /** ピースの座標のセッター。 */
  private _position(point: Point): void {
    this.piece.x = point.x;
    this.piece.y = point.y;
    this.piece.modified();
  }

  /**
   * ピースの更新頻度を変更する。
   */
  static changeUpdateCnt(): void {
    let actCnt = MyPlayer.actPlayerCnt;
    if(actCnt < 3) {
      this.cutCnt = 2;
    }else if(actCnt < 10) {
      this.cutCnt = 5;
    } else if(actCnt < 30) {
      this.cutCnt = 10;
    } else if(actCnt < 50) {
      this.cutCnt = 20;
    } else {
      this.cutCnt = 30;
    }
  }

  constructor(jigsaw: JigsawPazzle, pieceId: number, cutted: PiecesParam) {
    this.jigsaw = jigsaw;
    this.piece = new g.Sprite({
      scene: GameMaster.this.scene,
      src: cutted.piecesSrc.src,
      srcX: cutted.cutInfo[pieceId].p.x,
      srcY: cutted.cutInfo[pieceId].p.y,
      width: cutted.cutInfo[pieceId].s.w,
      height: cutted.cutInfo[pieceId].s.h,
      local: true,
      touchable: true,
    });
    this.pieceId = pieceId;
    this.connect = cutted.connectIds[pieceId];
    this.answerPosition = cutted.answerPos[pieceId];

    // マウスイベント
    this.piece.onPointDown.add(this.onPointDownP, this);
    this.piece.onPointMove.add(this.onPointMoveP, this);
    this.piece.onPointUp.add(this.onPointUpP, this);
  }

  /** 自ピースを持っているプレイヤー。 */
  holdPlayer(): MyPlayer | undefined {
    for (let p of MyPlayer.players) {
      if (p.holdPiece == this) return p;
    }
    return null;
  }

  /**
   * このピースに子ピースを追加する。
   */
  connectPiece(isSelf: boolean, piece: JigsawPiece): void {
    this.owner = undefined;
    if (this.children == undefined) {
      this.children = new Array();
    }
    this.append(isSelf, piece, true);

    // 子供に子供がいれば
    if (piece.children != undefined) {
      for (let c of piece.children) {
        this.append(isSelf, c, false);
      }
      piece.children = undefined;
    }
  }
  /**
   * ホントに追加する処理。
   */
  private append(isSelf: boolean, piece: JigsawPiece, playSound: boolean): void {
    if (playSound) {
      if(isSelf) MySound.pieceFit2.play();
      else       MySound.pieceFit.play();
    }
    this.children.push(piece);
    piece.owner = this;
    this.piece.append(piece.piece);
    // 座標を変える
    piece._position(this.justPxBw(piece));
  }

  /**
   * 完成したパズルを想定した距離。  
   * このボードに属さないピースが指定された場合エラー。
   * @returns `pieceA` を基準に `pieceB` が離れているピクセル数
   */
  justPxBw(piece: JigsawPiece): Point {
    return {
      x: piece.answerPosition.x - this.answerPosition.x,
      y: piece.answerPosition.y - this.answerPosition.y
    };
  }

  /**
   * ボードにハマった時。
   * @param playSound 音を再生するかどうか。
   */
  fitPiece(isSelf: boolean, playSound?: boolean): void {
    if (playSound !== false) {
      if(isSelf) MySound.pieceFit2.play();
      else       MySound.pieceFit.play();
    }

    this._position({
      x: this.answerPosition.x + this.jigsaw.margin.w,
      y: this.answerPosition.y + this.jigsaw.margin.h
    });

    this.fitted = true;
    this.piece.touchable = false;
    this.changeView(false);

    if (this.children != undefined) {
      for (let c of this.children) {
        c.fitted = true;
        c.piece.touchable = false;
      }
    }
  }

  /**
   * ピースが移動する時に呼ばれる。
   * @param pos 移動先の座標 x,y
   */
  move(pos: Point) {
    this.piece.moveTo(pos.x, pos.y);
    this.limitCheck();
    this.piece.modified();
  }

  /**
   * ボードの範囲外に出ていたら範囲内に戻す。
   */
  private limitCheck() {
    let p = this.piece;
    let max_x = this.jigsaw.pazzleSize.w - p.width;
    let max_y = this.jigsaw.pazzleSize.h - p.height;
    if (0 > p.x || isNaN(p.x)) p.x = 0;
    else if (p.x > max_x) p.x = max_x;
    if (0 > p.y || isNaN(p.y)) p.y = 0;
    else if (p.y > max_y) p.y = max_y;
  }

  /**
   * ピースの見た目を変更する。
   * @param isHold `true` 持っている状態。`false` 持っていない状態
   */
  changeView(isHold: boolean) {
    if(isHold) {
      this.piece.opacity = 0.5;
    } else {
      this.piece.opacity = 1;
    }
    this.piece.modified();
  }


  // ==================================== ピースイベント ====================================

  /**
   * クリックした時の処理。  
   * 親が居れば親にイベントを送る。
   * @param piece 別のピースから送られたイベントかどうか。違うなら `undefinded`
   */
  private onPointDownP(ev: g.PointDownEvent, piece?: JigsawPiece): void {
    if (g.game.isSkipping) return;
    // 自分が存在しない
    if (MyPlayer.self() == undefined) return;

    if (!ev.player || !ev.player.id)
      return;

    // ピースがボードにハマっているなら
    if (this.fitted) return;

    // バンされている
    if(MyPlayer.self().BAN) return;

    // 親がいるなら親にイベントを送る
    if (this.owner) {
      this.owner.onPointDownP(ev, this);
      return;
    }

    // ピースの更新回数をリセット
    JigsawPiece.updateCnt = 0;

    this.downPos = {
      x: this.piece.x,
      y: this.piece.y
    };

    let holdPlayer = this.holdPlayer();

    // 誰かがピースを持っている
    if (holdPlayer != undefined) return;
    let data = this.raiseDownEvent();
    this.downEvent(data);
  }
  /**
   * ピースクリックイベントを発行する。
   */
  raiseDownEvent(): PieceDownEventData {
    let data: PieceDownEventData = {
      id: PieceDownEventData.ID,
      pieceId: this.pieceId,
      playerId: MyPlayer.localPlayerId,
    };
    g.game.raiseEvent(new g.MessageEvent(data));
    return data;
  }

  /**
   * ピースをクリックした時に呼ばれるイベント。
   */
  downEvent(data: PieceDownEventData): void {
    /** ピースを操作したプレイヤー。 */
    let player = MyPlayer.searchPlayerId(data.playerId);

    // 同じピースを誰かが持っている
    let holder = MyPlayer.searchHoldPiece(this);
    
    if(holder != undefined && player.playerId != holder.playerId) {
      if(player.playerId < holder.playerId) {
        // ホールドユーザーを変更
        player.holdPiece = this;
      } else { return; }
    } else {
      player.holdPiece = this;
    }

    let holdPlayer = this.holdPlayer();
    // ピースを持ってるのは他人
    if (holdPlayer != undefined && !MyPlayer.isSelf(holdPlayer.playerId) && !g.game.isSkipping) {
      // 半透明に
      this.changeView(true);
      // // プレイヤー名部分
      // // 名前を表示
      // holdPlayer.showName(GameMaster.this.scene);
      // let pos = this.piece.localToGlobal({x: 0, y:-40});
      // holdPlayer.moveName(pos);
    }

    // このピースの描画順を一番上に
    if (this.piece.parent)
      this.piece.parent.append(this.piece);
  }

  /**
   * クリックしたまま移動した時の処理。  
   * 親が居れば親にイベントを送る。
   * @param childP 子ピースから送られたイベントかどうか。違うなら `undefinded`
   */
  onPointMoveP(ev: g.PointMoveEvent, childP?: JigsawPiece): void {
    if (g.game.isSkipping) return;
    // 自分が存在しない
    if (MyPlayer.self() == undefined) return;

    // ピースがボードにハマっているなら
    if (this.fitted) return;

    // 親がいるなら親にイベントを送る
    if (this.owner) {
      this.owner.onPointMoveP(ev, this);
      return;
    }

    let holdPlayer = this.holdPlayer();
    // ピースを持ってるのは他人
    if (holdPlayer == undefined || !MyPlayer.isSelf(holdPlayer.playerId)) return;
    // バンされている
    if(MyPlayer.self().BAN) return;

    // ピースの更新回数を増やす
    JigsawPiece.updateCnt++;

    this.lastDelta = ev.startDelta;

    let p = {
      x: this.downPos.x + ev.startDelta.x * GameMaster.this.camera.scaleX,
      y: this.downPos.y + ev.startDelta.y * GameMaster.this.camera.scaleY
    };

    let data: PieceMoveEventData = {
      id: PieceMoveEventData.ID,
      pieceId: this.pieceId,
      playerId: MyPlayer.localPlayerId,
      pos: {
        // x: this.piece.x + ev.prevDelta.x * GameMaster.this.camera.scaleX,
        // y: this.piece.y + ev.prevDelta.y * GameMaster.this.camera.scaleY
        x: p.x,
        y: p.y
      }
    };

    // ピースの更新を間引く
    if (JigsawPiece.updateCnt % JigsawPiece.cutCnt == 0) {
      g.game.raiseEvent(new g.MessageEvent(data));
    }
    this.moveEvent(data);
  }
  /**
   * ピースを移動した時に呼ばれるイベント。
   */
  moveEvent(data: PieceMoveEventData): void {
    if (this.fitted) return;
    if (this.owner) return;

    this.move(data.pos);

    let holdPlayer = this.holdPlayer();
    // // プレイヤー名部分
    // // ピースを持ってるのは他人
    // if (holdPlayer == undefined || !MyPlayer.isSelf(holdPlayer.playerId) && !g.game.isSkipping) {
    //   // 名前の位置を更新
    //   let pos = this.piece.localToGlobal({x: 0, y:-40});
    //   holdPlayer.moveName(pos);
    // }
  }

  /**
   * マウスを離した時のコールバック関数。  
   * 親が居れば親にイベントを送る。
   * @param piece 別のピースから送られたイベントかどうか。違うなら `undefinded`
   */
  private onPointUpP(ev: g.PointUpEvent, child?: JigsawPiece): void {
    if (g.game.isSkipping) return;
    // 自分が存在しない
    if (MyPlayer.self() == undefined) return;

    // ピースがボードにハマっているなら
    if (this.fitted) return;

    // 親がいるなら親にイベントを送る
    if (this.owner) {
      this.owner.onPointUpP(ev, this);
      return;
    }

    let holdPlayer = this.holdPlayer();
    // ピースを持ってるのは他人
    if (holdPlayer == undefined || !MyPlayer.isSelf(holdPlayer.playerId)) return;
    // バンされている
    if(MyPlayer.self().BAN) return;

    // ピースを離したイベント
    let data: PieceUpEventData = this.raiseUpEvent();

    // ピースのくっつきとハマり判定
    // ピースが繋がるかどうか
    // 繋がる場合 `conPId` には繋がった相手のピースIDが入る
    let ocp = this.jigsaw.connectPieceAll(this);
    if (ocp != undefined) {
      let data: ConnectPieceEventData = {
        id: ConnectPieceEventData.ID,
        ownerPieceId: ocp.owner.pieceId,
        childPieceId: ocp.child.pieceId,
        playerId: MyPlayer.self().playerId,
      };
      g.game.raiseEvent(new g.MessageEvent(data));
    }

    // ピースがボードにフィットするかどうか
    let fited = this.jigsaw.fitBoard(this);
    if (fited != undefined) {
      let data: FitPieceEventData = {
        id: FitPieceEventData.ID,
        pieceId: this.pieceId,
        playerId: MyPlayer.self().playerId,
      };
      g.game.raiseEvent(new g.MessageEvent(data));
    }

    // this.upEvent(data);
  }
  /**
   * upEvent を発行する。
   */
  raiseUpEvent(): PieceUpEventData {
    let data: PieceUpEventData = {
      id: PieceUpEventData.ID,
      pieceId: this.pieceId,
      playerId: MyPlayer.localPlayerId,
      pos: { x: this.piece.x, y: this.piece.y },
    };
    g.game.raiseEvent(new g.MessageEvent(data));
    return data;
  }

  /**
   * ピースを離した時に呼ばれるイベント。
   */
  upEvent(data: PieceUpEventData): void {
    if (this.fitted) return;

    let holdPlayer = this.holdPlayer();
    if (holdPlayer == undefined) return;

    holdPlayer.holdPiece = undefined;

    if (!this.owner)
      this.move(data.pos);

    // ピースを持ってるのは他人
    if (holdPlayer != undefined && !MyPlayer.isSelf(holdPlayer.playerId) && !g.game.isSkipping) {

      // // プレイヤー名部分
      // // 名前の位置を更新
      // let pos = this.piece.localToGlobal({x: 0, y:-40});
      // holdPlayer.moveName(pos);
      // // プレイヤー名を隠す
      // holdPlayer.hideName();
    }
  }
}