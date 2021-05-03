/* 
 * {x: number, y: number} みたいなタプルはここに書いておく
 * 
 * 
 * 
 */

import { JigsawPiece } from "./JigsawPiece";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

/** 行列。 */
export interface ColRow {
  /** 行。縦。 */
  col: number;
  /** 列。横。 */
  row: number;
}


/**
 * ピースIDとそのピースのパズルID。
 */
export interface PazzlePieceInfo {
  /** パズルのID。 */
  pazzleId: number;
  /** ピースのID。 */
  pieceId: number;
}
/**
 * プレイヤー名とスコアのセット。
 */
export interface NameScore {
  /** プレイヤー名。 */
  name: string;
  /** スコア。 */
  score: number;
}
/**
 * ゲームクリア時に送るプレイヤー１人分の情報。
 */
export interface ClearData {
  playerId: number;
  score: number;
}

/**
 * ピースの親子セット。
 */
export interface OwnerChildPiece {
  owner: JigsawPiece;
  child: JigsawPiece;
}

/**
 * パズルのピース枚数と縦横幅。
 */
export interface PzlDifficulty {
  /** ピース枚数。 */
  count: number;
  /** ピースサイズ。 */
  size: Size;
  /** 原点。左上座標。 */
  origin: Point;
}
/** `PzlDifficuly` を生成する。 */
export function CreatePzlD(s: string): PzlDifficulty {
  let ss = s.split(",");
  return {
    count: +ss[0],
    size: {
      w: +ss[1],
      h: +ss[2]
    },
    origin: {
      x: +ss[3],
      y: +ss[4]
    }
  };
}