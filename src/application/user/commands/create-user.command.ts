export class CreateUserCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly biography?: string,
    public readonly instagramId?: number,
    public readonly facebookId?: number,
    public readonly category?: string,
    public readonly externalUrl?: string,
    public readonly profileUrl?: string,
  ) {}
}
