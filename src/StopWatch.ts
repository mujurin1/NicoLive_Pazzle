
/**
 * 経過時間を測る。
 */
export class StopWatch {
  private _scene: g.Scene;

  /**  */
  private _timer: g.TimerIdentifier | undefined;
  /** 経過時間。 */
  private _time: number = 0;
  /** 経過時間。 */
  get time(): number {
    return this._time;
  }
  /** 経過時間の秒単位を取得。 */
  get time_s(): number {
    return this.time % 60;
  }
  /** 経過時間の分単位を取得。 */
  get time_m(): number {
    return Math.floor(this.time / 60) % 60;
  }
  /** 経過時間の時単位を取得。 */
  get time_h(): number {
    return Math.floor(this.time / 3600);
  }

  constructor(scene: g.Scene) {
    this._scene = scene;
  }

  /**
   * ストップウォッチを動かす。
   */
  start(): void {
    if(this._timer != undefined) return;
    this._timer = this._scene.setInterval(this.update, 1000, this);
  }

  /**
   * ストップウォッチを止める。
   */
  stop(): void {
    if(this._timer == undefined) return;
    this._scene.clearInterval(this._timer);
    this._timer = undefined;
  }

  /**
   * ストップウォッチを初期化する。
   */
  reset(): void {
    this.stop();
    this._time = 0;
  }

  /**
   * 1秒毎に実行される。
   */
  private update() {
    this._time += 1;
  }
}