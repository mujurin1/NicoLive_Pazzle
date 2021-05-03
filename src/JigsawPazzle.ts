import { GameMaster } from "./GameMaster";
import { JigsawPiece } from "./JigsawPiece";
import { MyPlayer } from "./MyPlayer";
import { PazzleAsset } from "./PazzleAsset";
import { PazzleAssets } from "./PazzleAssets";
import { CutParam, PieceCut } from "./PieceCut";
import { StopWatch } from "./StopWatch";
import { OwnerChildPiece, Point, Size } from "./Tuples";


export class JigsawPazzle {
  /** シーン。 */
  get scene(): g.Scene {
    return GameMaster.this.scene;
  }

  /** パズルID。アセットIDではない。 */
  pazzleId: number;
  /** パズルのアセット。 */
  get asset(): PazzleAsset {
    return PazzleAssets.this.pazzleAssets[this.pazzleId];
  }

  /** ピースの配列。 */
  pieces: JigsawPiece[];
  /** ピースの枚数。 */
  pieceCount: number;
  /** ボードにハマったピースの枚数。 */
  fittedPieceCount: number = 0;

  /** パズルエリアのサイズ。 */
  pazzleSize: Size;
  /**
   * ボードとパズルエリアのマージン。  
   * 上と下、左と右は同じ幅。
   */
  margin: Size;
  /** ピースのくっつく許容値。 */
  permission: number;

  /** ボードとピースを表示するレイヤー。 */
  masterLayer: g.E;
  /** ピースをハメるボードレイヤー。 */
  boardLayer: g.E;
  /** ピースが存在するピースレイヤー。 */
  pieceLayer: g.E;

  preview: g.Sprite;

  /** パズルの状態。 */
  pazzleStatus: "playing" | "clear" = "playing";
  /** 経過時間タイマー。 */
  stopWatch: StopWatch;

  /** 最後のピースをハメたプレイヤー。 */
  lastPlayer: MyPlayer | undefined;

  /**
   * パズルを生成する。  
   * 引数の `id` はアセットIDではないので注意。
   */
  constructor(id: number, param: CutParam) {
    this.pazzleId = id;
    let cutted = PieceCut.cut(this.scene, param);

    this.pieceCount = cutted.answerPos.length;
    this.pieces = new Array(this.pieceCount);

    this.preview = cutted.preview;

    this.margin = {
      w: this.preview.width,
      h: this.preview.height };
    this.pazzleSize = {
      w: this.preview.width  + this.margin.w*2,
      h: this.preview.height + this.margin.h*2 };
    this.stopWatch = new StopWatch(this.scene);
    this.stopWatch.start();

    // レイヤーの生成
    this.masterLayer = new g.E({ scene: this.scene });
    this.boardLayer = new g.E({ scene: this.scene });
    this.pieceLayer = new g.E({ scene: this.scene });
    // レイヤーの追加。順番大事。
    this.masterLayer.append(this.boardLayer);
    this.masterLayer.append(this.pieceLayer);

    // ピース生成
    for(let pId=0; pId<this.pieceCount; pId++) {
      this.pieces[pId] = new JigsawPiece(this, pId, cutted);
      this.pieceLayer.append(this.pieces[pId].piece);
    }

    this.permission = this.pieces[0].piece.width/6;
    // this.permission = 10000;

    // ピースを置く部分
    let back = new g.FilledRect({
      scene: this.scene,
      cssColor: "rgba(255,255,255,0.4)",
      width: this.preview.srcWidth,
      height: this.preview.srcHeight,
      x: this.margin.w,
      y: this.margin.h,
      parent: this.boardLayer,
    });

    this.randomLineUp();
  }

  /**
   * ピースをランダムに並べる。
   */
  randomLineUp() {
    /* list を作る。初期化（０から連番）
     * list からランダムな位置の要素を切り取る（削除してその要素を取得）
     * ary に切り取った要素を順番に詰める
     * ary の要素順にピースを並べる
     */
    let list: number[] = new Array(this.pieceCount);
    let ary: number[] = new Array(this.pieceCount);
    for(let i=0; i<list.length; i++) {
      list[i] = i;
    }
    for(let i=0; i<ary.length; i++) {
      let r = Math.floor(g.game.random.generate() * list.length);
      let n = list.splice(r, 1);
      ary[i] = n[0];
    }
    // ピース１つに使う面積
    let mw = this.pieces[0].piece.width  * 1.4;
    let mh = this.pieces[0].piece.height * 1.45;
    // 一番内側が縦横何枚並ぶか（横は両端を含めない、縦は含める）
    let lx = Math.ceil((this.preview.width ) / mw)   +1;
    let ly = Math.ceil((this.preview.height) / mh)+2 +1;
    // ピースを置く位置（初期位置を設定）
    let px = this.margin.w      -mw/2;
    let py = this.margin.h - mh -mh/2;
    let flg = true;
    let func = (): boolean => {
      let p = ary.pop();
      if(p == undefined){ flg = false; return true; }
      this.pieces[p].move({x: px, y: py});
      return false;
    };
    // １周外になるたび８枚増える
    while(flg) {
      // 右
      for(let r=0; r<lx; r++) {
        if(func()) break;
        px += mw;
      }
      // 下
      for(let r=0; r<ly-1; r++) {
        if(func()) break;
        py += mh;
      }
      // 左
      for(let r=0; r<lx+1; r++) {
        if(func()) break;
        px -= mw;
      }
      // 上
      for(let r=0; r<ly; r++) {
        if(func()) break;
        py -= mh;
      }
      lx += 2;
      ly += 2;
    }
  }

  // /**
  //  * @param pzlId 作成するパズルのID。`_pazzles` のインデックス。
  //  */
  // static create(pzlId: number): JigsawPazzle {
  //   let pzl = this._pazzles[pzlId];
  //   if(pzl != undefined) {
  //     pzl.init();
  //     return pzl;
  //   }
  //   pzl = new JigsawPazzle(pzlId);

  //   this._pazzles[pzlId] = pzl;
  //   return pzl;
  // }

  /**
   * IDからピースを取得する。
   * 
   * @param id 取得するピースのID
   */
  private getPiece(id: number) : JigsawPiece {
    return this.pieces[id];
  }

  /**
   * ２つのピースが繋がる位置にあるかを調べる。  
   * 隣り合ってないピースとも繋がると言われるので注意。
   * @returns 繋がるかどうか。どちらかのピースがこのボードのものでないなら `null`
   */
  private isConnect(pieceA: JigsawPiece, pieceB: JigsawPiece): boolean {
    let just = pieceA.justPxBw(pieceB);

    let posA = pieceA.position;
    let posB = pieceB.position;
    return (Math.abs(posB.x - posA.x - just.x) <= this.permission &&
            Math.abs(posB.y - posA.y - just.y) <= this.permission );
  }

  /**
   * 全てのピースがフィットしてればクリアにする。  
   * fitPiece() の後に呼ばれる。
   * @param player 最後にピースをハメたプレイヤー
   */
   clearCheck(player: MyPlayer): void {
    for(let p of this.pieces) {
      if(!p.fitted) return;
    }

    this.pazzleStatus = "clear";
    this.lastPlayer = player;
    GameMaster.this.clearPazzle(this);
  }

  /**
   * 指定したピースの周囲に繋がるピースがあれば繋げる。
   * 
   * 一度に繋がるピースは1つだけ。
   * @param piece 検査するピース
   * @returns 繋がったピースID。繋がらなければ `undefined`
   */
   connectPieceAll(piece: JigsawPiece): OwnerChildPiece | undefined {
    // 一度に繋がるピースは1つだけにしておく
    if(piece.children != undefined) {
      for(let child of piece.children) {
        let ocp = this.connectPieceNext(child);
        if(ocp != undefined)
          return ocp;
      }
    }
    return this.connectPieceNext(piece);
  }
  /**
   * ピースと、隣のピースが繋がるなら繋げる。  
   * `Next` の意味は「となり」
   * @param piece 検査するピース
   * @returns 繋がったピースID。繋がらなければ `undefined`
   */
  private connectPieceNext(piece: JigsawPiece): OwnerChildPiece | undefined {
    for(let nextId of piece.connect) {
      let ocp = this.connectPiece(piece, this.getPiece(nextId));
      if(ocp != undefined) return ocp;
    }
    return undefined;
  }
  /**
   * ２つのピースが繋がるなら繋げる。  
   * ２つのピースが隣り合っているかはここでは検査しない。
   * @param ownerP `pieceB` と隣り合っているピース。
   * @param childP `pieceA` と隣り合っているピース。
   */
  private connectPiece(ownerP: JigsawPiece, childP: JigsawPiece): OwnerChildPiece | undefined {
    // ピースがこのパズルのピースじゃなかった。
    // バグでも無い限り絶対 `false` になる（ここでリターンしない）はず
    if(ownerP.jigsaw != this || childP.jigsaw != this) return undefined;

    // すでに繋がっている
    if( ownerP.owner != undefined &&
        ( ownerP.owner.pieceId == childP.pieceId ||
          childP.owner != undefined &&
          ( ownerP.pieceId == childP.owner.pieceId ||
            ownerP.owner.pieceId == childP.owner.pieceId
          )
        ) ||
        childP.owner != undefined &&
        ownerP.pieceId == childP.owner.pieceId
      ) return undefined;

    // どっちかのピースは、誰かが持っている
    let holdOwner = ownerP.holdPlayer();
    let holdChild = childP.holdPlayer();
    if(holdOwner != undefined && !MyPlayer.isSelf(holdOwner.playerId) ||
       holdChild != undefined && !MyPlayer.isSelf(holdChild.playerId) )
      return undefined;

    // ボードにハマっているピース
    if(ownerP.fitted || childP.fitted) return undefined;

    // 繋がるかどうかを調べる
    if(!this.isConnect(ownerP, childP)) return undefined;

    // pieceA と pieceB が繋がるのはここまでで確定した。

    // owner がいればバトンタッチする
    if(ownerP.owner != undefined)
      ownerP = ownerP.owner;
    if(childP.owner != undefined)
      childP = childP.owner;

    // ownerP.connectPiece(childP);
    return {
      owner: ownerP,
      child: childP
    };
  }

  /**
   * ボードにピースがハマるならハメる。
   */
  fitBoard(piece: JigsawPiece): undefined | number {
    let pos = piece.position;

    if( Math.abs(pos.x - piece.answerPosition.x - this.margin.w) > this.permission ||
        Math.abs(pos.y - piece.answerPosition.y - this.margin.h) > this.permission )
      return undefined;

    return piece.pieceId;

    // piece.fitPiece();
    // this.boardLayer.append(piece.piece);
  }
}