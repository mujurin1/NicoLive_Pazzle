
/**
 * プレイヤーの情報。  
 * グローバル。
 */
export class MyPlayer implements g.Player {
  /** プレイヤーID。 */
  id: string;
  /** プレイヤー名。 */
  name: string;
  /** 生主かどうか。 */
  liver: boolean;
  /** マウスポインターの座標。 */
  pointer: { x: number, y: number };
  /** スコア。 */
  score: number;
  /** 持っているピースの情報。 */
  holdPiece: {
    /** `JigsawGame.playingPazzle` の要素番目。 */
    pazzleId: number,
    /** ピースのID。 */
    pieceId: number,
  } | undefined;

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
    this.holdPiece = undefined;
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
