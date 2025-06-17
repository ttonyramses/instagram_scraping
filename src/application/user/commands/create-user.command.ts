import { User } from '../../../domain/user/entities/user.entity';

export class CreateUserCommand {
  constructor(public readonly user: User) {}
}
