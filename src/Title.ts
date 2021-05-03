import { Label } from "@akashic-extension/akashic-label";
import { GameMaster } from "./GameMaster";
import { MyPlayer } from "./MyPlayer";
import { PazzleAsset } from "./PazzleAsset";
import { PazzleAssets } from "./PazzleAssets";
import { CutParam } from "./PieceCut";
import { labelAutoReSizeW } from "./PlayingInfo";

/**
 * タイトル画面。
 */
export class Title {
  static this: Title;

  /** シーン。 */
  get scene(): g.Scene {
    return GameMaster.this.scene;
  }

  /** タイトル画面全体の表示エンティティ。 */
  displayE: g.E;
  /** プレビュー画像を表示するエンティティ。 */
  private previewE: g.FilledRect;
  /** プレビュー中のパズルの情報を表示するエンティティ。 */
  private infoE: g.E;
  /** 難易度ボタンに触れなくする板。 */
  private guardE: g.E;
  /** 難易度ボタン。かんたん。 */
  private levelE: g.Sprite;
  /** 難易度ボタン。ふつう。 */
  private levelN: g.Sprite;
  /** 難易度ボタン。むずかしい。 */
  private levelH: g.Sprite;
  /** 表示するパズルアセットを更新する。 */
  private assetChange: (asset: PazzleAsset) => void;
  /** 参加人数を更新する。 */
  joinChange: (n: number) => void;
  /** ホストにだけ表示するエンティティ。 */
  private hostE: g.E;
  /** ホスト以外に表示するエンティティ。 */
  private userE: g.E;

  /** パズルを生成する情報。 */
  cutParam: CutParam;

  /** 普通のフォント。ノーマル。 */
  private fontN: g.Font;
  /** 縁取りフォント。ボーダー。 */
  private fontB: g.Font;

  /**
   * 選択した難易度。  
   * 0: 簡単  1: 普通  2: 難しい
   */
  selectD: number = 0;
  /** プレビュー中のパズルのID。 */
  sellectPzlId: number = 0;

  private constructor() {
    Title.this = this;
    let scene = this.scene;

    this.fontN = new g.DynamicFont({
      game: g.game,
      fontFamily: "sans-serif",
      fontWeight: "bold",
      size: 50,
    });
    this.fontB = new g.DynamicFont({
      game: g.game,
      fontFamily: "sans-serif",
      fontWeight: "bold",
      size: 50,
      strokeColor: "white",
      strokeWidth: 5,
    });

    // ========================= エンティティの生成 =========================
    this.displayE = new g.E({
      scene,
    });
    this.previewE = new g.FilledRect({
      scene,
      cssColor: "rgba(0,0,0)",
      width: 770, height: 460,
      x: 25, y: 35,
      parent: this.displayE,
    });

    // ========================= パズルの情報 =========================
    this.infoE = new g.E({
      scene,
      width: 380, height: 460,
      x: 850, y: 35,
      parent: this.displayE,
    });
    // タイトルの背景画像
    let titleBack = new g.Sprite({
      scene,
      src: scene.asset.getImageById("title_back"),
      parent: this.infoE,
    });
    // タイトルの文字
    let title = new Label({
      scene,
      width: 360,
      font: this.fontN,
      text: "たいとる",
      widthAutoAdjust: true,
      lineBreak: false,
      anchorX: 0.5,
      anchorY: 0.5,
      x: titleBack.width*0.5,
      y: titleBack.height*0.5,
      parent: titleBack,
    });

    // =========================== 難易度選択ボタン ===========================
    const text_x = 150;
    const text_w = 170;
    const text_my = -5;
    // かんたん。背景
    this.levelE = new g.Sprite({
      scene,
      src: scene.asset.getImageById("select_E"),
      y: titleBack.y + 100,
      touchable: true,
      parent: this.infoE,
    });
    // かんたん。文字
    let textE = new Label({
      scene,
      width: text_w,
      font: this.fontN,
      fontSize: 40,
      text: "50",
      textAlign: "right",
      anchorY: 0.5,
      x: text_x,
      y: this.levelE.height*0.5 + text_my,
      parent: this.levelE,
    });
    // ふつう。背景。
    this.levelN = new g.Sprite({
      scene,
      src: scene.asset.getImageById("select_N"),
      y: this.levelE.y + 100,
      opacity: 0.6,
      touchable: true,
      parent: this.infoE,
    });
    // ふつう。文字。
    let textN = new Label({
      scene,
      width: text_w,
      font: this.fontN,
      fontSize: 40,
      text: "100",
      textAlign: "right",
      lineBreak: false,
      anchorY: 0.5,
      x: text_x,
      y: this.levelE.height*0.5 + text_my,
      parent: this.levelN,
    });
    // むずかしい。背景。
    this.levelH = new g.Sprite({
      scene,
      src: scene.asset.getImageById("select_H"),
      y: this.levelN.y + 100,
      opacity: 0.6,
      touchable: true,
      parent: this.infoE,
    });
    // むずかしい。文字。
    let textH = new Label({
      scene,
      width: text_w,
      font: this.fontN,
      fontSize: 40,
      text: "200",
      textAlign: "right",
      lineBreak: false,
      anchorY: 0.5,
      x: text_x,
      y: this.levelN.height*0.5 + text_my,
      parent: this.levelH,
    });

    // ================================= 選択ボタンの処理 =================================
    this.levelE.onPointDown.add(ev => {
      this.levelE.opacity = 1;
      this.levelE.modified();
      this.levelN.opacity = 0.6;
      this.levelN.modified();
      this.levelH.opacity = 0.6;
      this.levelH.modified();
      this.selectD = 0;
      this.cutParam.size = PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].size;
      this.cutParam.origin =PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].origin;
    });
    this.levelN.onPointDown.add(ev => {
      this.levelE.opacity = 0.6;
      this.levelE.modified();
      this.levelN.opacity = 1;
      this.levelN.modified();
      this.levelH.opacity = 0.6;
      this.levelH.modified();
      this.selectD = 1;
      this.cutParam.size = PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].size;
      this.cutParam.origin =PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].origin;
    });
    this.levelH.onPointDown.add(ev => {
      this.levelE.opacity = 0.6;
      this.levelE.modified();
      this.levelN.opacity = 0.6;
      this.levelN.modified();
      this.levelH.opacity = 1;
      this.levelH.modified();
      this.selectD = 2;
      this.cutParam.size = PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].size;
      this.cutParam.origin =PazzleAssets.this.pazzleAssets[this.sellectPzlId].difficultys[this.selectD].origin;
    });

    // ===================================== 参加人数 =====================================
    // 参加人数。背景。
    // let joinCountBack = new g.FilledRect({
    //   scene,
    //   width: 380,
    //   height: 80,
    //   cssColor: "wood",
    //   y: this.levelH.y + 100,
    //   parent: this.infoE,
    // });
    let joinCountBack = new g.Sprite({
      scene,
      src: scene.asset.getImageById("sanka_nin"),
      y: this.levelH.y + 100,
      parent: this.infoE,
    });
    // 参加人数。文字。
    let joinCountText = new Label({
      scene,
      // width: text_w,
      width: 380,
      font: this.fontN,
      fontSize: 50,
      text: "0",
      textAlign: "center",
      lineBreak: false,
      anchorY: 0.5,
      y: joinCountBack.height*0.5 + text_my,
      parent: joinCountBack,
    });
    
    // 参加人数変更
    this.joinChange = (n: number) => {
      joinCountText.text = n+"";
      joinCountText.invalidate();
    }

    // =================================== 更新用 ===================================
    this.assetChange = asset => {
      title.text = asset.title;
      labelAutoReSizeW(title, 360);
      textE.text = asset.difficultys[0].count+"";
      textN.text = asset.difficultys[1].count+"";
      textH.text = asset.difficultys[2].count+"";
      textE.invalidate();
      textN.invalidate();
      textH.invalidate();
    }

    // 選択ボタンに触れなくする板
    this.guardE = new g.FilledRect({
      scene,
      width: this.infoE.width,
      height: this.infoE.height,
      cssColor: "rgba(0,0,0,0)",
      touchable: true,
      local: true,
      parent: this.infoE,
    });

    // バージョン情報
    new Label({
      scene,
      font: this.fontB,
      width: 200,
      height: 30,
      text: "v1.1.6",
      fontSize: 30,
      x: 1150,
      y: 650,
      parent: this.displayE,
    });

    this.crateHostUI();
    this.createUserUI();
    this.changePreview(0);
  }

  static create(): Title {
    if(this.this != undefined) return this.this;
    return new Title();
  }

  /**
   * ホストにだけ表示するUIを作成する。
   */
  private crateHostUI(): void {
    let scene = this.scene;

    this.hostE = new g.E({
      scene,
      opacity: 0,
    });

    let left = new g.Sprite({
      scene,
      src: scene.asset.getImageById("left"),
      x: 85, y: 570,
      parent: this.hostE,
      touchable: true,
    });
    let right = new g.Sprite({
      scene,
      src: scene.asset.getImageById("right"),
      x: 350, y: 570,
      parent: this.hostE,
      touchable: true,
    });
    let start = new g.Sprite({
      scene,
      src: scene.asset.getImageById("playBtn"),
      x: 950,
      y: 550,
      parent: this.hostE,
      touchable: true,
    });
    left.onPointDown.add(ev => this.changePreview(this.sellectPzlId-1));
    right.onPointDown.add(ev => this.changePreview(this.sellectPzlId+1));
    start.onPointDown.add(ev => GameMaster.this.start());
  }
  /**
   * ホスト以外に表示するUIを作成する。
   */
  private createUserUI(): void {
    let scene = this.scene;

    this.userE = new g.E({
      scene,
      opacity: 0,
    });
    let text = new Label({
      scene,
      font: this.fontB,
      text: "生主がパズルを選択中",
      x: 300, y: 580,
      width: 800,
      local: true,
      parent: this.userE,
    });
  }

  /**
   * ホストとクライアントのUIの可視性を変更する。
   */
  changeHostUI() {
    if(MyPlayer.isHost()) {               // ホスト
      this.guardE.touchable = false;
      if(this.hostE.opacity == 0) {
        this.hostE.opacity = 1;
        this.displayE.append(this.hostE);
      }
      if(this.userE.opacity == 1) {
        this.userE.opacity = 0;
        this.displayE.remove(this.userE);
      }
    } else {                              // クライアント
      this.guardE.touchable = true;
      if(this.hostE.opacity == 1) {
        this.hostE.opacity = 0;
        this.displayE.remove(this.hostE);
      }
      if(this.userE.opacity == 0) {
        this.userE.opacity = 1;
        this.displayE.append(this.userE);
      }
    }
    this.hostE.modified();
  }


  /**
   * プレビューするパズルを変える。  
   * 範囲外の値を選択するとループする。
   * @param idx プレビューするパズルアセットのID
   */
  changePreview(idx: number): void {
    let assets = PazzleAssets.this.pazzleAssets;

    this.sellectPzlId = idx;
    this.sellectPzlId = (this.sellectPzlId + assets.length) % assets.length;

    /** プレビューするパズル。 */
    let asset = assets[this.sellectPzlId];

    spriteSet(asset.preview, this.previewE.width, this.previewE.height);

    if(this.previewE.children != undefined) {
      this.previewE.remove(this.previewE.children[0]);
    }

    this.previewE.append(asset.preview);

    this.assetChange(PazzleAssets.this.pazzleAssets[this.sellectPzlId]);

    this.cutParam = {
      image: asset.previewSrc,
      wakus: PazzleAssets.this.wakus,
      size: asset.difficultys[this.selectD].size,
      colRol: "max",
      origin: asset.difficultys[this.selectD].origin
    }
  }
}



/**
 * `g.Sprite` エンティティを調整する。
 * @param wid 調整する基準の幅
 * @param hei 調整する基準の高さ
 */
export function spriteSet(spr: g.Sprite, wid: number, hei: number) {
  spr.x = 0;
  spr.y = 0;
  let widPer = wid / spr.width;
  let heiPer = hei / spr.height;
  // 比率が `widPer == heiPer == 1.0` の場合無駄な処理になるけどまず無いしいいや
  if(widPer > heiPer) {         // プレビューエリアに対してパズルが横長
    // より小さい方に合わせて伸縮させる
    spr.scale(heiPer);
    // 小さい方は下が余ってるので真ん中に動かす
    spr.x = (wid - spr.width * spr.scaleX) / 2;
  } else {                      // プレビューエリアに対してパズルが縦長
    spr.scale(widPer);
    spr.y = (hei - spr.height * spr.scaleY) / 2;
  }
  spr.modified();
}