
/**
 * `MessageData.data` の基本型。
 */
export interface MEDataBase {
  /** イベントのID。それぞれのイベントで固定値にする。 */
  id: number;
  /** プレイヤーID */
  playerId: string;
}

/**
 * ピースをクリックした時のイベントデータ型。
 */
export class PieceDownEventData implements MEDataBase {
  /** イベントのID。`this.id` と一致する。 */
  static ID = 0;

  /** イベントのID。 */
  id: 0;
  /** プレイヤーID。 */
  playerId: string;
  /** パズルID。 */
  pazzleId: number;
  /** ピースID。 */
  pieceId: number;
}
/**
 * ピースを動かした時のイベントデータの型。
 */
 export class PieceMoveEventData implements MEDataBase {
  /** イベントのID。`this.id` と一致する。 */
  static ID = 1;

  /** イベントのID。 */
  id: 1;
  /** プレイヤーID。 */
  playerId: string;
  /** パズルID。 */
  pazzleId: number;
  /** ピースID。 */
  pieceId: number;
  /** 移動先。 */
  pos: { x:number, y:number };
}
/**
 * ピースを離した時のイベントデータの型。
 */
export class PieceUpEventData implements MEDataBase {
  /** イベントのID。`this.id` と一致する。 */
  static ID = 2;

  /** イベントのID。 */
  id: 2;
  /** プレイヤーID。 */
  playerId: string;
  /** パズルID。 */
  pazzleId: number;
  /** ピースID。 */
  pieceId: number;
  /** 移動先。 */
  pos: { x:number, y:number };
}