import { User } from '../../../domain/user/entities/user.entity';

export class SaveAllUsersCommand {
  constructor(public readonly users: User[]) {}
}
