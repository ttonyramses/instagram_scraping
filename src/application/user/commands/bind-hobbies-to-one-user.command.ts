import { Hobby } from '../../../domain/hobby/entities/hobby.entity';

export class BindHobbiesToOneUserCommand {
  constructor(
    public readonly userId: string,
    public readonly hobbies: Hobby[],
  ) {}
}
