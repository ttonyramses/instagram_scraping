export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly biography?: string,
    public readonly category?: string,
  ) {}
}
