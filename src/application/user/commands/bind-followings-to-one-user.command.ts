import { User } from '../../../domain/user/entities/user.entity';

export class BindFollowingsToOneUserCommand {
  constructor(
    public readonly userId: string,
    public readonly followings: User[],
  ) {}
}
