export class CreateUserCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly biography?: string,
    public readonly json?: object,
    public readonly nbFollowers?: number,
    public readonly nbFollowings?: number,
    public readonly nbPublications?: number,
    public readonly instagramId?: number,
    public readonly facebookId?: number,
    public readonly category?: string,
    public readonly externalUrl?: string,
    public readonly profileUrl?: string,
    public readonly hasInfo?: boolean,
    public readonly hasFollowerProcess?: boolean,
    public readonly hasFollowingProcess?: boolean,
    public readonly enable?: boolean,
    public readonly maxIdFollower?: string,
    public readonly maxIdFollowing?: string,
  ) {}
}
