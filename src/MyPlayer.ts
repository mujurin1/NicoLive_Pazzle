
/**
 * プレイヤーの情報。
 * 
 * グローバル。
 */
export class MyPlayer implements g.Player {
  id: string;
  name: string;
  /** 生主かどうか。 */
  liver: boolean;
  /** マウスポインターの座標。 */
  pointer: { x: number, y: number };
  /** スコア。 */
  score: number;

  /**
   * onPlayerJoin メソッドにより呼び出される。
   * @param name プレイヤー名
   * @param id ユーザーID
   * @param liver 生主か？
   */
  constructor(id: string, name: string, liver?: boolean) {
    this.id = id;
    this.name = name;
    this.liver = liver == true;
    this.pointer = {x: 0, y: 0};
    this.score = 0;
  }

  /**
   * プレイヤー情報の更新。
   */
  updateInfo(name: string) {
    this.name = name;
  }

  /**
   * スコア加算。
   */
  scoreUp(s: number) {
    this.score += s;
  }

  /**
   * ポインターを絶対値で指定して動かす。
   */
  move(x: number, y: number) {
    this.pointer = {x, y};
  }
}















// import { EntityStateFlags } from "@akashic/akashic-engine";
// import { JigsawGame } from "./JigsawGame";

// /**
//  * プレイヤーの情報を管理するクラス。
//  * 参加してるプレイヤー分のクラスが生成される。
//  */
// export class MyPlayerInfo {
//   /**
//    * プレイヤー名。
//    */
//   name: string;
//   /**
//    * プレイヤーが生主かどうか。
//    */
//   liver: boolean;
//   /**
//    * 参加しているかどうか。
//    */
//   playing: boolean;
//   /**
//    * スコア。
//    */
//   score: number;

//   constructor(id: string, name: string, liver?: boolean) {
//     this.name = name;
//     this.liver = (liver != undefined && liver);
//     this.playing = false;
//     this.score = 0;
//   }

//   /**
//    * ゲームに参加する。
//    */
//   play() {
//     if(g.game.selfId == undefined) return;
//     this.playing = true;
//   }
// }