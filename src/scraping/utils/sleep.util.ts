// sleep.util.ts
import { injectable } from 'inversify';

@injectable()
export class SleepUtil {
  sleep(timeMilliSeconde: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeMilliSeconde);
    });
  }
}