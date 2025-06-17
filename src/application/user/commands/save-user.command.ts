import { UserDto } from '../../../presentation/user/dto/user.dto';

export class SaveUserCommand {
  constructor(public readonly userDto: UserDto) {}
}
