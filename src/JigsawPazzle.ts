import { JigsawGame } from "./JigsawGame";
import { JigsawPiece } from "./JigsawPiece";

/**
 * ジグソーパズルのデータ。
 * `JigsawGame` に新しくパズルを追加する時の引数に使う。
 */
export interface PazzleProperty {
  /** パズルのID */
  pazzleId: number;
  /** パズルのプレビュー画像のアセット。 */
  preview: g.ImageAsset;
  /** パズルのピース画像のアセット。 */
  pieces: g.ImageAsset;
  /** パズルの設定ファイルのアセットから読み込んだ文字列配列。 */
  setting: string[];
}

/**
 * ジグソーパズルクラス。  
 * ボードとピースをセットで持っている。
 * 
 * 背景レイヤーとピースレイヤーを２つ持っている。
 * 
 * ローカル。
 */
export class JigsawPazzle {
  /** パズルのID。 */
  pazzleId: number;
  /** パズルの名前。 */
  name: string;
  /** パズルの完成画像。この位置に応じて、ピースがハマる位置が変わる。 */
  preview: g.Sprite;
  /**
   * このボードのピース。  
   * ピースのIDと要素番目は等しい。
   */
  pieces: JigsawPiece[];

  /**
   * パズル全体を表示するレイヤー。
   */
  masterLayer: g.E;
  /**
   * ボード用のレイヤー。  
   * ピースを置く目安の背景。
   */
  boardLayer: g.E;
  /** このボードのピースを表示するレイヤー。 */
  pieceLayer: g.E;

  /**
   * このパズルエリアの幅。  
   * 参照用、変更してはいけない。
   */
  width: number;
  /**
   * このパズルエリアの高さ。  
   * 参照用、変更してはいけない。
   */
  height: number;
  /** パズルを置くパネルと、エリアの差（余白） */
  margin: {w:number, h:number};
  /** ピースのくっつく許容値。 */
  permission: number;

  /** このパズルをクリアしたか。 */
  isClear: boolean = false;

  /**
   * _
   */
  constructor(scene: g.Scene, param: PazzleProperty){
    this.pazzleId = param.pazzleId;
    this.name = param.setting[0];
    this.preview = new g.Sprite({
      scene,
      src: param.preview,
      local: true,
    });
    // パズルを置くパネルと、エリアの差（余白）
    this.margin = {
      w: Math.floor(this.preview.width * 0.8),
      h: Math.floor(this.preview.height * 0.8) };
    // このパズルのエリアを設定
    this.width = this.preview.width + this.margin.w*2;
    this.height = this.preview.height + this.margin.h*2;
    this.masterLayer = new g.E({
      scene: scene,
      width: this.width,
      height: this.height,
      local: true,
    });
    this.boardLayer = new g.E({
      scene: scene,
      width: this.preview.width,
      height: this.preview.height,
      x: this.margin.w,
      y: this.margin.h,
      local: true,
      parent: this.masterLayer,
    });
    this.pieceLayer = new g.E({
      scene: scene,
      width: this.width,
      height: this.height,
      local: true,
      parent: this.masterLayer,
    });
    /** ピースの総数。 */
    var pieceCnt = +param.setting[1];
    this.pieces = new Array(pieceCnt);
    for(var pId=0; pId<pieceCnt; pId++) {
      var pos = param.setting[pId + 2].split(",");
      var con = param.setting[pieceCnt + 2 + pId].split(",");
      var cutInfo = param.setting[pieceCnt*2 + 2 + pId].split(",");

      this.pieces[pId] = new JigsawPiece({
        scene: scene,
        src: param.pieces,
        srcX: +cutInfo[0],
        srcY: +cutInfo[1],
        width: +cutInfo[2],
        height: +cutInfo[3],
        parent: this.pieceLayer,
        pazzle: this,
        pieceId: pId,
        position: pos,
        connectPiece: con,
        local: true,
        touchable: true,
      });
    }

    /* ピースをランダムに並べる
     * list を作る。初期化（０から連番）
     * list からランダムな位置の要素を切り取る（削除してその要素を取得）
     * ary に切り取った要素を順番に詰める
     * ary の要素順にピースを並べる
     */
    var list: number[] = new Array(pieceCnt);
    var ary: number[] = new Array(pieceCnt);
    for(var i=0; i<list.length; i++) {
      list[i] = i;
    }
    
    for(var i=0; i<ary.length; i++) {
      var r = Math.floor(g.game.random.generate() * list.length);
      
      var n = list.splice(r, 1);
      ary[i] = n[0];
    }

    // ピース１つに使う面積
    var mw = this.pieces[0].width * 1.2;
    var mh = this.pieces[0].height * 1.2;
    // 一番内側が縦横何枚並ぶか（横は両端を含めない、縦は含める）
    var lx = Math.ceil(this.boardLayer.width / mw);
    var ly = Math.ceil(this.boardLayer.height / mh)+2;
    // ピースを置く位置（初期位置を設定）
    var px = this.boardLayer.x;
    var py = this.boardLayer.y - mh;
    var flg = true;
    // １周外になるたび８枚増える
    while(flg) {
      // 右
      for(var r=0; r<lx; r++) {
        var p = ary.pop();
        if(p == undefined){ flg = false; break; }
        this.pieces[p].moveTo(px, py);
        px += mw;
      }
      // 下
      for(var r=0; r<ly-1; r++) {
        var p = ary.pop();
        if(p == undefined){ flg = false; break; }
        this.pieces[p].moveTo(px, py);
        py += mh;
      }
      // 左
      for(var r=0; r<lx+1; r++) {
        var p = ary.pop();
        if(p == undefined){ flg = false; break; }
        this.pieces[p].moveTo(px, py);
        px -= mw;
      }
      // 上
      for(var r=0; r<ly; r++) {
        var p = ary.pop();
        if(p == undefined){ flg = false; break; }
        this.pieces[p].moveTo(px, py);
        py -= mh;
      }
      lx += 2;
      ly += 2;
    }

    // 許容値を変える
    this.permission = this.pieces[0].width/8;
    this.changeBoard();
  }

  /** 配列の中に一致する値があるか調べる。 */
  private aryFind(ary: number[], s: number): boolean {
    for(var n of ary) {
      if(n == s) return true;
    }
    return false;
  }

  /**
   * ピースを置く背景を変更する。
   */
  changeBoard() {
    // // 背景として完成画像を置く
    // var back = new g.Sprite({
    //   scene: this.preview.scene,
    //   src: this.preview.src,
    //   parent: this.boardLayer,
    // });
    // 背景そのままだと見づらいので、少し暗くする
    var fillter = new g.FilledRect({
      scene: this.preview.scene,
      width: this.preview.srcWidth,
      height: this.preview.srcHeight,
      cssColor: "rgba(0,0,0,0.4)",
      parent: this.boardLayer,
    });
  }

  /**
   * 指定したピースの周囲に繋がるピースがあれば繋げる。
   * 
   * 一度に繋がるピースは1つだけ。
   * @param piece 検査するピース
   * @returns 繋がったピースID。繋がらなければ `undefined`
   */
  connectPieceAll(piece: JigsawPiece): number | undefined {
    // 一度に繋がるピースは1つだけにしておく
    if(piece.pieceChildren != undefined) {
      for(var child of piece.pieceChildren) {
        let pId = this.connectPieceNext(child);
        if(pId != undefined)
          return pId;
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
  private connectPieceNext(piece: JigsawPiece): number | undefined {
    for(var nextId of piece.connectPieceIds) {
      if( this.connectPiece(piece, this.getPiece(nextId)) )
        return nextId;
    }
    return undefined;
  }
  /**
   * ２つのピースが繋がるなら繋げる。  
   * ２つのピースが隣り合っているかはここでは検査しない。
   * @param pieceA `pieceB` と隣り合っているピース。
   * @param pieceB `pieceA` と隣り合っているピース。
   */
  private connectPiece(pieceA: JigsawPiece, pieceB: JigsawPiece): boolean {
    // ピースがこのパズルのピースじゃなかった。
    if(pieceA.pazzle != this || pieceB.pazzle != this) {
      throw Error(`このボードに属さないピースが指定されました。\n pieceA ${pieceB}\n pieceA ${pieceB}`);
    };

    // すでに繋がっている
    if( pieceA.owner != undefined &&
        ( pieceA.owner.pieceId == pieceB.pieceId ||
          pieceB.owner != undefined &&
          ( pieceA.pieceId == pieceB.owner.pieceId ||
            pieceA.owner.pieceId == pieceB.owner.pieceId
          )
        ) ||
        pieceB.owner != undefined &&
        pieceA.pieceId == pieceB.owner.pieceId
      ) return false;

      // ボードにハマっているピース
    if(pieceA.fited || pieceB.fited) return false;

    // 繋がるかどうかを調べる
    if(!this.isConnect(pieceA, pieceB)) return false;

    // pieceA と pieceB が繋がるのはここまでで確定した。

    // owner がいればバトンタッチする
    if(pieceA.owner != undefined)
      pieceA = pieceA.owner;
    if(pieceB.owner != undefined)
      pieceB = pieceB.owner;

    if(pieceA.pieceChildren == undefined)
      pieceA.pieceChildren = new Array();
    // pieceA に pieceB と childPiece を入れる
    pieceA.pieceChildren.push(pieceB);
    if(pieceB.pieceChildren != undefined) {
      for(var child of pieceB.pieceChildren) {
        pieceA.pieceChildren.push(child);
      }
    }
    pieceB.pieceChildren = undefined;
    // 1. `owner` を `ownerPiece` に
    // 2. `owner` に `piece` を追加する
    // 3. `piece` の座標を正しくする
    for(var piece of pieceA.pieceChildren) {
      piece.owner = pieceA;
      piece.owner.append(piece);
      var disPx = this.justPxBw(piece.owner, piece);
      piece.x = disPx.x;
      piece.y = disPx.y;
      piece.modified();
    }
    return true;
  }

  /**
   * ボードにピースがハマるならハメる。
   */
  fitPiece(piece: JigsawPiece): boolean {
    if(piece.pazzle != this) {
      throw Error(`このボードに属さないピースが指定されました。\n piece ${piece}`);
    }
    var pos = piece.getPosition();

    // // ハマらないなら
    // if( Math.abs(pos.x - piece.position.x) > this.permission ||
    //     Math.abs(pos.y - piece.position.y) > this.permission )
    // ハマらないなら
    if( Math.abs(pos.x - piece.position.x - this.margin.w) > this.permission ||
        Math.abs(pos.y - piece.position.y - this.margin.h) > this.permission )
      return false;

    // ピースの座標をボードにピッタリ合わせる
    piece.x = piece.position.x;
    piece.y = piece.position.y;
    // ピースをピースレイヤーからボードレイヤーに移動する
    this.boardLayer.append(piece);

    piece.fitted();
    if(piece.pieceChildren != undefined) {
      for(var p of piece.pieceChildren)
        p.fitted(false);
    }
    return true;
  }

  /**
   * 全てのピースがフィットしてればクリアにする。  
   * fitPiece() の後に呼ばれる。
   */
  clearCheck(): void {
    for(var p of this.pieces) {
      if(!p.fited) return;
    }
    // ここまで来たなら、クリア
    this.isClear = true;
    JigsawGame.this.pazzleClear(this);
  }

  /**
   * ２つのピースが繋がる位置にあるかを調べる。
   * 隣り合ってないピースとも繋がると言われるので注意。
   * @returns 繋がるかどうか。どちらかのピースがこのボードのものでないなら `null`
   */
  private isConnect(pieceA: JigsawPiece, pieceB: JigsawPiece): boolean {
    var just = this.justPxBw(pieceA, pieceB);

    var posA = pieceA.getPosition();
    var posB = pieceB.getPosition();
    return (Math.abs(posB.x - posA.x - just.x) <= this.permission &&
            Math.abs(posB.y - posA.y - just.y) <= this.permission );
  }

  /**
   * 完成したパズルを想定した距離。
   * 
   * このボードに属さないピースが指定された場合エラー。
   * 
   * @returns `pieceA` を基準に `pieceB` が離れているピクセル数
   */
  justPxBw(pieceA: JigsawPiece, pieceB: JigsawPiece): {x: number, y: number} {
    if(pieceA.pazzle != pieceB.pazzle)
      throw Error(`このボードに属さないピースが指定されました。\npieceA ${pieceA}\npieceB ${pieceB}`);
    return {
      x: pieceB.position.x - pieceA.position.x,
      y: pieceB.position.y - pieceA.position.y,
    };
  }

  /**
   * IDからピースを取得する。
   * 
   * @param id 取得するピースのID
   */
  private getPiece(id: number) : JigsawPiece {
    // 存在しないIDを検索した
    if(id < 0 || this.pieces.length-1 < id) {
      throw Error(`Error: 存在しないピースを検索した。\nピースID:${id} は ${this.name} に存在しません。`);
    }
    return this.pieces[id];
  }
}