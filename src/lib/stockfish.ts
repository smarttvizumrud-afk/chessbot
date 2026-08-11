export type EngineLine = { bestMove: string; score: number };

type Pending = {
  resolve: (line: EngineLine) => void;
  reject: (error: Error) => void;
  bestMove: string;
  score: number;
};

export class StockfishClient {
  private worker?: Worker;
  private pending?: Pending;

  async evaluate(fen: string, depth = 10): Promise<EngineLine> {
    const worker = this.getWorker();
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject, bestMove: '', score: 0 };
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
      window.setTimeout(() => {
        if (this.pending) {
          const pending = this.pending;
          this.pending = undefined;
          pending.reject(new Error('Stockfish analysis timed out.'));
        }
      }, 12_000);
    });
  }

  stop() {
    this.worker?.terminate();
    this.worker = undefined;
  }

  private getWorker() {
    if (this.worker) return this.worker;
    this.worker = new Worker('/stockfish-18-lite-single.js');
    this.worker.onmessage = (event: MessageEvent<string>) => this.handleLine(String(event.data));
    this.worker.postMessage('uci');
    this.worker.postMessage('isready');
    return this.worker;
  }

  private handleLine(line: string) {
    const pending = this.pending;
    if (!pending) return;
    if (line.includes(' score cp ')) pending.score = readScore(line, 'cp');
    if (line.includes(' score mate ')) pending.score = readScore(line, 'mate') * 1000;
    if (line.startsWith('bestmove ')) {
      pending.bestMove = line.split(' ')[1] ?? '';
      this.pending = undefined;
      pending.resolve({ bestMove: pending.bestMove, score: pending.score });
    }
  }
}

function readScore(line: string, kind: 'cp' | 'mate') {
  const match = line.match(new RegExp(`score ${kind} (-?\\d+)`));
  return match ? Number(match[1]) : 0;
}
