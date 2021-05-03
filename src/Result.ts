import { Label } from "@akashic-extension/akashic-label";
import { GameMaster } from "./GameMaster";
import { MyPlayer } from "./MyPlayer";
import { labelAutoReSizeW, newFont } from "./PlayingInfo";
import { NameScore } from "./Tuples";

/**
 * パズルクリア後のリザルト。
 */
export class Result {
  private get scene(): g.Scene {
    return GameMaster.this.scene;
  }

  static this: Result;

  /** リザルト全体の表示。背景も兼ねてる。 */
  display: g.E;
  /** ランキング表示部分。このエンティティ範囲外は描画されないはず。 */
  rankPane: g.Pane;
  rankingView: g.E;
  // フォント
  lastPlayerFont: g.Font;
  rankingRankFont: g.Font;
  rankingNameFont: g.Font;
  rankingScoreFont: g.Font;
  // 最後の人の王冠と名前
  lastPlayerCrown: g.Sprite;
  lastPlayerName: Label;
  lastPlayerChange: (p: MyPlayer) => void;
  // ランキング
  rankCrowns: g.Sprite[];
  rankRanks: Label[];
  rankNames: Label[];
  rankScores: Label[];

  private constructor() {
    Result.this = this;

    this.display = new g.Sprite({
      scene: this.scene,
      src: this.scene.asset.getImageById("result"),
      x: 50, y: 10,
      hidden: true,
      local: true,
    });
    this.rankPane = new g.Pane({
      scene: this.scene,
      width: 780,
      height: 365,
      x: 45, y:180,
      local: true,
      parent: this.display,
      touchable: true,
    });
    this.rankingView = new g.E({
      scene: this.scene,
      width: this.rankPane.width,
      height: 0,
      local: true,
      parent: this.rankPane,
    });

    // 最後にピースをハメたプレイヤー
    this.lastPlayerFont = newFont("sans-serif", 50, "#23664B");
    // ランキング
    this.rankingRankFont = newFont("sans-serif", 36);
    this.rankingNameFont = newFont("sans-serif", 36);
    this.rankingScoreFont = newFont("sans-serif", 30);
    // // リザルトを閉じる
    // this.closeBtn = new g.Sprite({
    //   scene: this.scene,
    //   src: this.scene.asset.getImageById("close"),
    //   x: 300, y: 570,
    //   local: true,
    //   touchable: true,
    //   parent: this.display,
    // });
    // this.closeBtn.onPointDown.add(ev => {
    //   this.display.hide();
    // });

    // ランキング配列初期化
    this.rankCrowns = new Array();
    this.rankRanks = new Array();
    this.rankNames = new Array();
    this.rankScores = new Array();

    // ==================================== 最後のピースをハメた人 ====================================
    // 王冠マーク
    this.lastPlayerCrown = new g.Sprite({
      scene: this.scene,
      src: this.scene.asset.getImageById("crown_0"),
      x: 55, y: 90,
      local: true,
      parent: this.display,
    });
    // 名前
    const lastP_wid = 640;
    this.lastPlayerName = new Label({
      scene: this.scene,
      font: this.lastPlayerFont,
      text: "最後のピースをはめた人",
      widthAutoAdjust: true,
      lineBreak: false,
      width: lastP_wid,
      x: 170, y: 90,
      local: true,
      parent: this.display,
    });
    this.lastPlayerChange = p => {
      this.lastPlayerName.text = p.name;
      labelAutoReSizeW(this.lastPlayerName, lastP_wid);
    }

    // this.lastPlayerChange = t => {
    //   this.lastPlayerLabel.text = t;
    //   this.lastPlayerLabel.scale(1);
    //   labelAutoReSize(this.lastPlayerLabel, 680);
    //   this.lastPlayerLabel.x = 435 - this.lastPlayerLabel.width/2;
    //   this.lastPlayerLabel.modified();
    // }

    // タッチイベント
    this.rankPane.onPointMove.add(ev => {
      this.rankingView.y += ev.prevDelta.y;
      if(this.rankingView.y < this.rankPane.height - this.rankingView.height)
        this.rankingView.y = this.rankPane.height - this.rankingView.height;
      if(this.rankingView.y > 0)
        this.rankingView.y = 0;
      this.rankingView.modified();
    });
  }

  /**
   * 初期化。
   */
  init(): void {
    this.hide();
  }

  /**
   * リザルトの生成。
   */
  static create(): void {
    if(this.this != undefined) return;
    new Result();
  }

  /**
   * リザルトを表示する。
   */
  show(): void {
    this.display.show();
    this.rankingView.y = 0;
    this.rankingView.modified();
  }

  /**
   * リザルトを非表示にする。
   */
  hide(): void {
    this.display.hide();
  }

  /**
   * リザルトを描画する。
   * @param lastP 最後のピースをハメたプレイヤー
   * @param players プレイヤーの配列
   */
  rankingChange(lastP: MyPlayer, players: MyPlayer[]) {
    for(let i=0; i<this.rankCrowns.length; i++) {
      this.rankCrowns[i].destroy();
    }
    for(let i=0; i<this.rankRanks.length; i++) {
      this.rankRanks[i].destroy();
      this.rankNames[i].destroy();
      this.rankScores[i].destroy();
    }

    this.rankCrowns = new Array();
    this.rankRanks = new Array();
    this.rankNames = new Array();
    this.rankScores = new Array();

    // １人分のランキング列縦幅
    const height = 57;
    const margin_wid = 10;
    const crown_wid = 40;
    const rank_x = crown_wid + margin_wid;
    const rank_wid = 113;
    const name_wid = 520;
    const name_x = rank_x + rank_wid + margin_wid*2;
    const score_wid = 150;
    const score_x = name_x + name_wid + margin_wid;

    this.rankingView.height = height * players.length;

    // 最後のピースをはめた人
    this.lastPlayerChange(lastP);

    // ========================================= ランキング =========================================
    for(let i=0; i<players.length; i++) {
      let p = players[i];
      // 王冠マーク
      if(p.rank <= 3) {
        let crown = new g.Sprite({
          scene: this.scene,
          src: this.scene.asset.getImageById("crown_"+p.rank),
          x: 5, y: height*i,
          local: true,
          parent: this.rankingView,
        });
        this.rankCrowns.push(crown);
      }
      // 順位
      let rank = new Label({
        scene: this.scene,
        font: this.rankingRankFont,
        text: p.rank+"位",
        textAlign: "right",
        width: rank_wid,
        x: rank_x, y: height*i,
        local: true,
        parent: this.rankingView,
      });
      // 名前
      let name = new Label({
        scene: this.scene,
        font: this.rankingNameFont,
        text: p.name,
        widthAutoAdjust: true,
        lineBreak: false,
        x: name_x, y: height*i,
        width: name_wid,
        local: true,
        parent: this.rankingView,
      });
      labelAutoReSizeW(name, name_wid);
      // スコア
      let score = new Label({
        scene: this.scene,
        font: this.rankingScoreFont,
        text: p.score+"",
        lineBreak: false,
        x: score_x, y: height*i,
        width: score_wid,
        local: true,
        parent: this.rankingView,
      });
      this.rankRanks.push(rank);
      this.rankNames.push(name);
      this.rankScores.push(score);
    }
  }
}