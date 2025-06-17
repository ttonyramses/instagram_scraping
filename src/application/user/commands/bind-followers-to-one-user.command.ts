import { User } from '../../../domain/user/entities/user.entity';

export class BindFollowersToOneUserCommand {
  constructor(
    public readonly userId: string,
    public readonly followers: User[],
  ) {}
}
