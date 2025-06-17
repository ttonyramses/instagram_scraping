import { UserDto } from '../../../presentation/user/dto/user.dto';

export class AddFollowingsCommand {
  constructor(
    public readonly userId: string,
    public readonly followings: UserDto[],
  ) {}
}
