import { Collision } from "@akashic/akashic-engine";
import { ColRow, Point, Size } from "./Tuples";

/**
 * 切り抜くのに必要な情報。  
 * `size` は `image` のサイズの約数（割り切れる値）にすること。
 */
export interface CutParam {
  /** 切り抜く元画像。 */
  image: g.ImageAsset | g.Surface;
  /**
   * 枠の配列。  
   * 凸凹２つなので枠の数＊２要る。  
   * 出っ張り*2：本体 ＝ ２：４。
   */
  wakus: g.ImageAsset[];
  /**
   * 生成するピースのサイズ。  
   * 枠の凸の都合上、絶対４の倍数。
   */
  size: Size;
  /** 生成するピースの行列数。`max` なら最大枚数に */
  colRol: ColRow | "max";
  /**
   * 画像を切り抜く原点。左上座標。
   */
  origin: Point;
}
/**
 * ピースを生成するのに必要なデータ。
 */
export interface PiecesParam {
  /** プレビュー画像 */
  preview: g.Sprite;
  /** 切り抜いた画像。 */
  piecesSrc: g.Sprite;
  /** 正解の座標。 */
  answerPos: Point[];
  /** くっ付くピースID。 */
  connectIds: number[][];
  /** ピースを切り抜くための情報。 */
  cutInfo: {p: Point, s: Size}[];
}

/**
 * プレビュー画像からピース画像に切り抜く。
 */
export class PieceCut {
  static cut(scene: g.Scene, params: CutParam): PiecesParam {
    // =============================== 切り抜くエリアを設定 ===============================
    // 切り抜くエリアのサイズ
    let areaW: number, areaH: number;
    // プレビューの実際に使える領域サイズ
    let preW = params.image.width - params.origin.x;
    let preH = params.image.height - params.origin.y;
    if(params.colRol == "max") {
      // areaW = Math.floor(params.image.width/params.size.w);
      // areaH = Math.floor(params.image.height/params.size.h);
      areaW = Math.floor(preW/params.size.w) * params.size.w;
      areaH = Math.floor(preH/params.size.h) * params.size.h;
    } else {
      areaW = params.size.w * params.colRol.row;
      areaH = params.size.h * params.colRol.col;
      // 元画像より小さいサイズに修正
      if(areaW > preW) areaW = Math.floor(preW/params.size.w) * params.size.w;
      if(areaH > preH) areaH = Math.floor(preH/params.size.h) * params.size.h;
    }

    // while(areaW > params.image.width) areaW -= params.size.w;
    // while(areaH > params.image.height) areaH -= params.size.h;

    // // 切り抜く領域の半分のサイズ
    // let areaW_H = Math.floor(areaW/2);
    // let areaH_H = Math.floor(areaH/2);

    // 切り抜く領域の左上の座標
    // let areaX = params.center.x - areaW_H;
    // let areaY = params.center.y - areaH_H;
    // { // 右下の座標は、計算が終わったらもう要らないのでブロックで囲む
    //   // 切り抜く領域の右下の座標
    //   let _x = areaX + areaW;
    //   let _y = areaY + areaH;

    //   // 切り抜く領域の座標が範囲外なら修正
    //   if(areaX < 0) {
    //     // _x += x;
    //     areaX = 0;
    //   } else if(_x > params.image.width) {
    //     areaX -= _x - params.image.width;
    //     // _x = params.image.width;
    //   }
    //   if(areaY < 0) {
    //     // _y += y;
    //     areaY = 0;
    //   } else if(_x > params.image.height) {
    //     areaY -= _y - params.image.height;
    //     // _y = params.image.height;
    //   }
    // }

    // エリアの行列数
    let area_C = areaW / params.size.w;
    let area_R = areaH / params.size.h;

    // ================================ その他情報 ================================
    const overlapW = params.size.w / 4;
    const overlapH = params.size.h / 4;
    // 上左右下があるかどうか
    let isT = (id: number): boolean => id >= area_C;
    let isL = (id: number): boolean => id%area_C != 0;
    let isR = (id: number): boolean => id%area_C != area_C-1;
    let isB = (id: number): boolean => id < area_C*(area_R-1);
    // ピースの数
    const count = area_R * area_C;
    


    // 返すやつ
    let answerPos: Point[] = new Array(count);
    let connectIds: number[][] = new Array(count);
    let cutInfo: {p: Point, s: Size}[] = new Array(count);
    for(let i=0; i<count; i++)
      connectIds[i] = new Array();

    // ================================= プレビューを作成 =================================
    let preview = new g.Sprite({
      scene,
      src: params.image,
      srcX: params.origin.x,
      srcY: params.origin.y,
      width: areaW,
      height: areaH,
    });



    // ================================= 全体図を作成 =================================
    let view = new g.E({
      scene,
    });
    let img = new g.Sprite({
      scene,
      src: params.image,
      local: true,
    });

    let newView = (putP: Point, getP: Point, s: Size) => {
      let e = new g.Pane({
        scene,
        width: Math.ceil(s.w),
        height: Math.ceil(s.h),
        x: putP.x,
        y: putP.y,
        local: true,
      });
      img.x = -getP.x - params.origin.x;
      img.y = -getP.y - params.origin.y;
      img.modified();
      e.append(img);
      view.append(g.SpriteFactory.createSpriteFromE(scene, e));
    }
    let size: Size;
    let putP: Point = {x: 0, y: 0};
    for(let r=0; r<area_R; r++) {
      putP.x = 0;
    for(let c=0; c<area_C; c++) {
      let id = r*area_C + c;
      let getP: Point = {
        x: c*params.size.w,
        y: r*params.size.h,
      };
      size = {w: params.size.w, h: params.size.h};
      if(isT(id)) {
        getP.y -= overlapH;
        size.h += overlapH;
        connectIds[id].push(id-area_C);
      }
      if(isL(id)) {
        getP.x -= overlapW;
        size.w += overlapW;
        connectIds[id].push(id-1);
      }
      if(isR(id)) {
        size.w += overlapW;
        connectIds[id].push(id+1);
      }
      if(isB(id)) {
        size.h += overlapH;
        connectIds[id].push(id+area_C);
      }
      newView(putP, getP, size);
      putP.x += size.w;
    }
    putP.y += size.h;
    }

    // ここまででプレビュー画像を切って配置が出来た

    // ============================== 切り抜くピース情報を作成 ==============================
    /* 
     * 切り抜く枠 `wakuAry`
     * 値%2             : 0: 凸  1: 凹
     * Math.floor(値/2) : 枠の種類
     */
    const WAKU_TYPES = params.wakus.length/2;


    // 切り抜く枠の種類
    let wakuAry: number[] = new Array(area_C*2 * area_R);
    for(let i=0; i<wakuAry.length; i++) {
      wakuAry[i] = Math.floor(g.game.random.generate() * WAKU_TYPES * 2);
    }

    // 枠の拡大率
    let scaleX = (params.size.w+overlapW*2) / params.wakus[0].width;
    let scaleY = (params.size.h+overlapH*2) / params.wakus[0].height;


    // ================================ 枠を重ねる ================================
    let put = (p: Point, wakuId: number, angle: number): void => {
      // 拡大率と枠のサイズ。回転角で変わる。
      let sx: number, sy: number, wW: number, wH: number;
      if(angle == 0 || angle == 180) {
        sx = scaleX;
        sy = scaleY;
        wW = params.wakus[wakuId].width * scaleX;
        wH = params.wakus[wakuId].height * scaleY;
      } else {
        sx = scaleY;
        sy = scaleX;
        wW = params.wakus[wakuId].width * scaleY;
        wH = params.wakus[wakuId].height * scaleX;
      }

      let a = new g.Sprite({
        scene,
        src: params.wakus[wakuId],
        scaleX: sx,
        scaleY: sy,
        angle: angle,
        local: true,
        compositeOperation: "destination-out",
      });
      // if(angle == 0 || angle == 180) {
      //   a.x = p.x + a.width/2*a.scaleX;
      //   a.y = p.y + a.height/2*a.scaleY;
      // } else {
      //   a.x = p.x + a.height/2*a.scaleY;
      //   a.y = p.y + a.width/2*a.scaleX;
      // }

      if(angle == 0) {              // 無回転
        a.x = p.x;
        a.y = p.y;
      } else if(angle == 180) {     // 上下反対回転
        a.x = p.x + wW;
        a.y = p.y + wH;
      } else if(angle == 90) {      // 右に一回転
        a.x = p.x + wH;
        a.y = p.y;
      } else if(angle == -90) {     // 左に一回展
        a.x = p.x;
        a.y = p.y + wW;
      }
      a.x = Math.ceil(a.x);
      a.y = Math.ceil(a.y);

      a.modified();

      // console.log(`x : ${a.x}   y : ${a.y}`);
      // console.log(`w : ${a.width}   h : ${a.height}`);
      // console.log(`sy: ${a.scaleX}   sy: ${a.scaleY}`);
      // console.log(`sw: ${a.width*a.scaleX}   sw: ${a.height*a.scaleY}`);

      view.append(a);
    }

    putP.y = -overlapH;
    for(let r=0; r<area_R; r++) {
      putP.x = -overlapW;
    for(let c=0; c<area_C; c++) {
      let pos: Point = {
        x: c*(params.size.w+overlapW*2),
        y: r*(params.size.h+overlapH*2) };
      let size: Size = {
        w: params.size.w,
        h: params.size.h };


      let id = r*area_C + c;
      // 自分の右側の枠の位置
      let migi = area_C*2 * Math.floor(id/area_C) + id%area_C;
      if(isT(id)) {
        let wId = wakuAry[migi - area_C];
        put(putP, wId, 0);
        if(wId%2 == 0) {
          pos.y -= overlapH;
          size.h += overlapH;
        }
      }
      if(isL(id)) {
        let wId = wakuAry[migi - 1];
        put(putP, wId, -90);
        if(wId%2 == 0) {
          pos.x -= overlapW;
          size.w += overlapW;
        }
      }
      if(isR(id)) {
        let wId = (wakuAry[migi]+1)%2;
        put(putP, wId, 90);
        if(wId%2 == 0) size.w += overlapW;
      }
      if(isB(id)) {
        let wId = (wakuAry[migi + area_C]+1)%2;
        put(putP, wId, 180);
        if(wId%2 == 0) size.h += overlapH;
      }
      answerPos[id] = {
        x: pos.x - overlapW*2 * c,
        y: pos.y - overlapH*2 * r,
      };
      cutInfo[id] = {
        p: {
          x: pos.x,
          y: pos.y
        }, s: {
          w: size.w,
          h: size.h
        }
      };
      putP.x += params.size.w + overlapW*2;
    }
    putP.y += params.size.h + overlapH*2;
    }

    let pane = new g.Pane({
      scene,
      width: (area_C-1) * (params.size.w+overlapW*2) + params.size.w,
      height: (area_R-1) * (params.size.h+overlapH*2) + params.size.h,
    });
    pane.append(view);

    let image = g.SpriteFactory.createSpriteFromE(scene, pane);

    return {
      preview,
      piecesSrc: image,
      answerPos,
      connectIds,
      cutInfo
    };
  }

}