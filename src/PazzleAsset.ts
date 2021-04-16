import { PazzleProperty } from "./JigsawPazzle";

/**
 * パズルアセットを纏めるクラス。
 * 全部のアセットをここで取得する。
 * 
 * 設定ファイル（"setting.txt"）  
 * １行目　　　　　　　　パズルのタイトル  
 * ２行目　　　　　　　　ピースの枚数（PN）  
 * ３～PN+3行目　　　　　ピースの座標  
 * (3+PN) ~ (3+PN*2 -1)　結合するピースのID（最後のID番目の行は存在しない）  
 * それ以降の行　　　　　適当に  
 * 
 * 例  
 * 1: パズルのタイトル  
 * 2: 2  
 * 3: 0,0  
 * 4: 0,10  
 * 5: 0  
 */
export class PazzleAssets {
  /** アセットのパス。`/assets` */
  private static ASSET_DIR: string = "/assets";
  /** 全体の設定ファイルパス。`/assets/setting.txt` */
  private static ASSET_SETTING: string = `${PazzleAssets.ASSET_DIR}/setting.txt`;
  /** アセットの設定ファイル名。`setting.txt` */
  private static SETTING_FILE: string = "setting.txt";
  /** アセットの完成画像ファイル名。`preview.jpg` */
  private static PREVIEW_FILE: string = "preview.jpg";
  /** ピースが集まった画像。 */
  private static PIECES_FILE: string = "pieces.png";

  /** アセットの所属するシーン。 */
  scene: g.Scene;
  /** 全体の設定ファイル。行ごとに配列に格納。 */
  asset_setting: string[];
  /** パズルアセットの数。 */
  count: number;
  /** パズルのアセット配列。 */
  pazzles: PazzleProperty[];


  /**
   * 全てのパズルアセットを取得する。
   * @param scene アセットの所属しているシーン。
   */
  constructor(scene: g.Scene) {
    this.scene = scene;

    this.asset_setting = this.scene.asset.getText(PazzleAssets.ASSET_SETTING).data.split("\r\n");
    this.count = +(this.asset_setting[0]);
    this.pazzles = new Array(this.count);
    this.readAssets();
  }

  /**
   * 全アセットの読み込み。
   */
  private readAssets(): void {
    for(var pzlId=0; pzlId<this.count; pzlId++) {
      var dir = `${PazzleAssets.ASSET_DIR}/${pzlId}`;
      var pre = this.scene.asset.getImage(`${dir}/${PazzleAssets.PREVIEW_FILE}`);
      var set = this.scene.asset.getText(`${dir}/${PazzleAssets.SETTING_FILE}`).data.split("\r\n");
      this.pazzles[pzlId] = {
        pazzleId: pzlId,
        preview: this.scene.asset.getImage(`${dir}/${PazzleAssets.PREVIEW_FILE}`),
        pieces: this.scene.asset.getImage(`${dir}/${PazzleAssets.PIECES_FILE}`),
        setting: this.scene.asset.getText(`${dir}/${PazzleAssets.SETTING_FILE}`).data.split("\r\n"),
      };
    }
  }
}