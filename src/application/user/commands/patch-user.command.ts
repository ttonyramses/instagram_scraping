import { User } from '../../../domain/user/entities/user.entity';

export class UpdateUserCommand {
  constructor(public readonly user: User) {}
}
