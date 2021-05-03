import { GameMaster } from "./GameMaster";
import { PazzleAsset } from "./PazzleAsset";

/**
 * パズルのアセットを管理するクラス。
 */
export class PazzleAssets {
  /** アセットのパス。`/assets` */
  private static ASSET_DIR: string = "/assets";
  /** 全体の設定ファイルパス。`/assets/setting.txt` */
  private static ASSET_SETTING_TXT: string = `${PazzleAssets.ASSET_DIR}/!.txt`;
  /** 枠画像フォルダ名。 */
  private static WKAU_DIR: string = `${PazzleAssets.ASSET_DIR}/!`;

  static this: PazzleAssets;

  /** シーン。 */
  get scene(): g.Scene {
    return GameMaster.this.scene;
  }
  /** 全体の設定ファイル。行ごとに配列に格納。 */
  asset_setting: string[];
  /** パズルアセットの数。 */
  pzlCount: number;
  /** パズルのアセット配列。 */
  pazzleAssets: PazzleAsset[];
  /** ピースの枠の数。 */
  wakuCount: number;
  /** ピースの枠画像アセット。ピースの種類x2ある。 */
  wakus: g.ImageAsset[];

  /**
   * 全てのパズルアセットを取得する。
   * @param scene アセットの所属しているシーン。
   */
  private constructor() {
    PazzleAssets.this = this;

    this.asset_setting = this.scene.asset.getText(PazzleAssets.ASSET_SETTING_TXT).data.split("\r\n");
    this.wakuCount = +(this.asset_setting[0]);
    this.wakus = new Array();
    // ピース枠の生成
    for(let i=0; i<this.wakuCount; i++) {
      let ws = this.getWaku(i);
      this.wakus.push(GameMaster.this.scene.asset.getImage(ws[0]));
      this.wakus.push(GameMaster.this.scene.asset.getImage(ws[1]));
    }

    this.pzlCount = +(this.asset_setting[1]);
    this.pazzleAssets = new Array(this.pzlCount);
    // パズルアセットの生成
    for(let pzlId=0; pzlId<this.pzlCount; pzlId++) {
      // このパズルの最初の行
      let info = this.getSetting(pzlId);

      this.pazzleAssets[pzlId] = new PazzleAsset({
        pazzleId: pzlId,
        title: info[0],
        preview: this.scene.asset.getImage(`${PazzleAssets.ASSET_DIR}/${info[1]}.jpg`),
        setting: info.slice(2),
      });
    }
  }

  static create(): void {
    if(this.this != undefined) return;
    new PazzleAssets();
  }

  /**
   * 設定ファイルから指定個目のパズル情報を取得する。  
   * １行目：タイトル  
   * ２行目：ファイル名  
   * ３～５行目：パズルの難易度毎の情報
   */
  private getSetting(id: number): string[] {
    let line = id*4 + 2;
    let titile_dir = this.asset_setting[line].split(" ");
    return [
      titile_dir[0],
      titile_dir[1],
      this.asset_setting[line+1],
      this.asset_setting[line+2],
      this.asset_setting[line+3],
    ];
  }

  /**
   * 枠。
   */
  private getWaku(id: number): string[] {
    return [`${PazzleAssets.WKAU_DIR}/${id}0.png`, `${PazzleAssets.WKAU_DIR}/${id}1.png`];
  }
}