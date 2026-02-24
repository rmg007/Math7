import * as fs from 'fs';

export interface HistoryRecord {
  date: string;
  score: number;
  coverage: number;
  failures: number;
}

export class Historian {
  private historyPath: string;
  private maxRuns: number;

  constructor(historyPath: string, maxRuns: number) {
    this.historyPath = historyPath;
    this.maxRuns = maxRuns;
  }

  record(record: HistoryRecord) {
    let history: HistoryRecord[] = [];
    if (fs.existsSync(this.historyPath)) {
      history = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
    }

    history.push(record);

    // Keep only last X runs
    if (history.length > this.maxRuns) {
      history = history.slice(-this.maxRuns);
    }

    fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
    return history;
  }
}
