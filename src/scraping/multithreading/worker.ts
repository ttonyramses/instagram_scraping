import { UserDto } from 'src/domaine/user/dto/user.dto';
import { expose } from 'threads/worker';

class Stack<T> {
  private stack: T[] = [];

  push(item: T): void {
    this.stack.push(item);
  }

  pop(): T | undefined {
    return this.stack.pop();
  }

  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  size(): number {
    return this.stack.length;
  }

  clear(): void {
    this.stack = [];
  }
}

expose(()=>new Stack<UserDto>())