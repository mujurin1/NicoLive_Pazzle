import { JigsawGame } from "./JigsawGame";
import { JigsawPazzle } from "./JigsawPazzle";
import { PieceDownEventData, PieceMoveEventData, PieceUpEventData } from "./MyEventData";

export interface PieceParameterObject extends g.SpriteParameterObject {
  /** 所属するパズル。 */
  pazzle: JigsawPazzle;
  /** ピースのID。 */
  pieceId: number;
  /** ピースの座標の文字列。["X", "Y"] */
  position: string[];
  /** 繋がるピースのIDの文字列。["a","b",".."] */
  connectPiece: string[];
}

/**
 * ジグソーパズルのピース。  
 * ローカルです。
 */
export class JigsawPiece extends g.Sprite {
  /** 自分の所属するボード。 */
  pazzle: JigsawPazzle;
  /** ピースID。 */
  pieceId: number;
  /** パズルが完成した時のピースの位置。 */
  position: { x: number, y: number }
  /** 繋がるピースのID。 */
  connectPieceIds: number[];
  /**
   * 自分の親ピースのID。  
   * 繋がっているピースのうち最もIDが小さいピース。
   */
  owner: JigsawPiece | undefined;
  /**
   * 自分の子ピース。  
   * 子ピースは全て自分よりIDが大きい。
   */
  pieceChildren: JigsawPiece[] | undefined;
  /** ピースを持っているユーザー。 */
  holdUser: any | undefined;
  /**
   * ピースがハマっているか。  
   * 真なら動かせない。
   */
  fitted: boolean;

  constructor(param: PieceParameterObject) {
    if(param.local != true) 
      throw Error("ピースの `local` は `true` にしてください。");
    if(param.touchable != true)
      throw Error("ピース生成時の `touchable` は `true` にしてください。")

    super(param);
    this.pazzle = param.pazzle;
    this.pieceId = param.pieceId;
    this.position = {x: +param.position[0], y: +param.position[1]};
    this.connectPieceIds = new Array();
    for(var con of param.connectPiece)
      this.connectPieceIds.push(+con);
    this.owner = undefined;
    this.pieceChildren = undefined;
    this.holdUser = undefined;
    this.fitted = false;

    // マウスイベント
    this.onPointDown.add(this.onPointDownP, this);
    this.onPointMove.add(this.onPointMoveP, this);
    this.onPointUp.add(this.onPointUpP, this);
  }

  /**
   * ピースの座標を返す。
   */
   getPosition(): {x: number, y: number} {
    if(!this.owner) {
      var x = this.x;
      var y = this.y;
    } else {
      var disPx = this.pazzle.justPxBw(this.owner, this);
      var ownPos = this.owner.getPosition();
      x = ownPos.x + disPx.x;
      y = ownPos.y + disPx.y;
    }
    return {x, y};
  }

  /**
   * ピースがボードにハマった時にボードから呼び出される。  
   * ハマった時にボードに座標を合わせる処理をした後に実行される。
   * 
   * @param hold ハメたとき持っていたピースかどうか
   */
  fitting(hold?: boolean) {
    this.fitted = true;
    this.touchable = false;
    
    if(hold == undefined) hold = true;
    if(!hold) return;
    // この後に効果音やら演出やら書こう
  }

  /**
   * クリックした時の処理。  
   * 親が居れば親にイベントを送る。
   * @param piece 別のピースから送られたイベントかどうか。違うなら `undefinded`
   */
  private onPointDownP(ev: g.PointDownEvent, piece?: JigsawPiece): void {
    if(!ev.player || !ev.player.id)
      return;

    // ピースがボードにハマっているなら
    if(this.fitted) return;

    // 親がいるなら親にイベントを送る
    if(this.owner) {
      this.owner.onPointDownP(ev, this);
      return;
    }

    // ピースを持ってるのは他人
    if(this.holdUser && this.holdUser != ev.player.id) return;

    var data: PieceDownEventData = {
      id: 0,
      pazzleId:this.pazzle.pazzleId,
      pieceId: this.pieceId,
      playerId: ev.player.id
    };
    g.game.raiseEvent(new g.MessageEvent(data));
    this.downEvent(data);
  }
  /**
   * ピースをクリックした時に呼ばれるイベント。
   */
  downEvent(data: PieceDownEventData): void {
    // ホールドユーザーを変更
    this.holdUser = data.playerId;
    // このピースの描画順を一番上に
    if(this.parent)
      this.parent.append(this);
  }

  /**
   * クリックしたまま移動した時の処理。  
   * 親が居れば親にイベントを送る。
   * @param piece 別のピースから送られたイベントかどうか。違うなら `undefinded`
   */
  private onPointMoveP(ev: g.PointMoveEvent, piece?: JigsawPiece): void {
    if(!ev.player || !ev.player.id)
      return;

    // ピースがボードにハマっているなら
    if(this.fitted) return;

    // 親がいるなら親にイベントを送る
    if(this.owner) {
      this.owner.onPointMoveP(ev, this);
      return;
    }

    // ピースを持ってるのは他人
    if(this.holdUser != ev.player.id) return;

    var data: PieceMoveEventData = {
      id: 1,
      pazzleId:this.pazzle.pazzleId,
      pieceId: this.pieceId,
      playerId: ev.player.id,
      pos: {
        x: this.x + ev.prevDelta.x * JigsawGame.this.camera.scaleX,
        y: this.y + ev.prevDelta.y * JigsawGame.this.camera.scaleY }
    };

    g.game.raiseEvent(new g.MessageEvent(data));
    this.moveEvent(data);
  }
  /**
   * ピースを移動した時に呼ばれるイベント。
   */
  moveEvent(data: PieceMoveEventData): void {
    if(this.fitted) return;
    this.move(data.pos);
  }

  /**
   * マウスを離した時のコールバック関数。  
   * 親が居れば親にイベントを送る。
   * @param piece 別のピースから送られたイベントかどうか。違うなら `undefinded`
   */
   private onPointUpP(ev: g.PointUpEvent, child?: JigsawPiece): void {
    if(!ev.player || !ev.player.id)
      return;

    // ピースがボードにハマっているなら
    if(this.fitted) return;

    // 親がいるなら親にイベントを送る
    if(this.owner) {
      this.owner.onPointUpP(ev, this);
      return;
    }

    // ピースを持ってるのは他人
    if(this.holdUser != ev.player.id) return;

    var data: PieceUpEventData = {
      id: 2,
      pazzleId:this.pazzle.pazzleId,
      pieceId: this.pieceId,
      playerId: ev.player.id,
      pos: {x: this.x, y: this.y},
    };
    g.game.raiseEvent(new g.MessageEvent(data));
    // this.upEvent(data);
  }
  /**
   * ピースを離した時に呼ばれるイベント。
   */
  upEvent(data: PieceUpEventData): void {
    this.move(data.pos);
    console.log("x: "+this.x+"   y: "+this.y);

    this.holdUser = undefined;

    // つなげたユーザーを取得
    var p = JigsawGame.this.searchPlayer(data.playerId);
    if(p == undefined) return;

    // ピースが繋がるなら繋げる
    // 繋がる場合 `conPId` には繋がった相手のピースIDが入る
    var conPId = this.pazzle.connectPieceAll(this);
    if(conPId) {
      // ピースが繋がった場合
      p.scoreUp(1);
    }
    // ピースがボードにフィットするならフィットする
    var fited = this.pazzle.fitPiece(this);
    if(fited) {
      // ピースが盤面にハマった
      p.scoreUp(1);
    }
    // パズルをクリアしたかを調べる。
    this.pazzle.clearCheck();
  }

  /**
   * ピースが移動する時に呼ばれる。
   * @param pos 移動先の座標 x,y
   */
  private move(pos: {x:number, y:number}) {
    this.moveTo(pos.x, pos.y);
    this.limitCheck();
    this.modified();
  }

  /**
   * ボードの範囲外に出ていたら範囲内に戻す。
   */
  private limitCheck() {
    var max_x = this.pazzle.width - this.width;
    var max_y = this.pazzle.height - this.height;
    if(0 > this.x)          this.x = 0;
    else if(this.x > max_x) this.x = max_x;
    if(0 > this.y)          this.y = 0;
    else if(this.y > max_y) this.y = max_y;
  }
}
