import { GameMaster } from "./GameMaster";
import { PieceCut } from "./PieceCut";
import { CreatePzlD, Point, PzlDifficulty, Size } from "./Tuples";

/**
 * アセットの情報。
 */
 export interface PazzleProperty {
  /** ID */
  pazzleId: number;
  /** パズル名。 */
  title: string;
  /** プレビュー画像のアセット。 */
  preview: g.ImageAsset;
  /** 設定ファイルのアセットから読み込んだ文字列配列。 */
  setting: string[];
}


/**
 * パズルアセットクラス。
 */
export class PazzleAsset {
  // ======================== アセットの情報 ========================
  /** ID */
  pazzleId: number;
  /** プレビュー画像のアセット。 */
  previewSrc: g.ImageAsset | g.Surface;
  /** タイトル。 */
  title: string;
  /**
   * パズルの難易度３つ。  
   * 0:簡単  1:普通  2:難しい
   */
  difficultys: PzlDifficulty[];

  /** プレビュー画像のエンティティ。 */
  preview: g.Sprite;

  constructor(param: PazzleProperty) {
    this.pazzleId = param.pazzleId;
    this.previewSrc = param.preview;
    this.preview = new g.Sprite({
      scene: GameMaster.this.scene,
      src: this.previewSrc,
    });
    this.title = param.title;
    this.difficultys = [
      CreatePzlD(param.setting[0]),
      CreatePzlD(param.setting[1]),
      CreatePzlD(param.setting[2])
    ];
  }
}