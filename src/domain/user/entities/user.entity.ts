export class User {
  constructor(
    private readonly _id: string,
    private _name?: string | null,
    private _biography?: string | null,
    private _json?: object | null,
    private _nbFollowers?: number | null,
    private _nbFollowings?: number | null,
    private _nbPublications?: number | null,
    private _instagramId?: number | null,
    private _facebookId?: number | null,
    private _category?: string | null,
    private _externalUrl?: string | null,
    private _profileUrl?: string | null,
    private _hasInfo: boolean = false,
    private _hasFollowerProcess: boolean = false,
    private _hasFollowingProcess: boolean = false,
    private _enable: boolean = true,
    private _maxIdFollower?: string | null,
    private _maxIdFollowing?: string | null,
    private _createdAt?: Date,
    private _updatedAt?: Date,
  ) {
    this.validateUser();
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string | null { return this._name ?? null; }
  get biography(): string | null { return this._biography ?? null; }
  get json(): object | null { return this._json ?? null; }
  get nbFollowers(): number | null { return this._nbFollowers ?? null; }
  get nbFollowings(): number | null { return this._nbFollowings ?? null; }
  get nbPublications(): number | null { return this._nbPublications ?? null; }
  get instagramId(): number | null { return this._instagramId ?? null; }
  get facebookId(): number | null { return this._facebookId ?? null; }
  get category(): string | null { return this._category ?? null; }
  get externalUrl(): string | null { return this._externalUrl ?? null; }
  get profileUrl(): string | null { return this._profileUrl ?? null; }
  get hasInfo(): boolean { return this._hasInfo; }
  get hasFollowerProcess(): boolean { return this._hasFollowerProcess; }
  get hasFollowingProcess(): boolean { return this._hasFollowingProcess; }
  get enable(): boolean { return this._enable; }
  get maxIdFollower(): string | null { return this._maxIdFollower ?? null; }
  get maxIdFollowing(): string | null { return this._maxIdFollowing ?? null; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  // Méthodes métier
  updateProfile(name?: string, biography?: string, category?: string): void {
    if (name !== undefined) this._name = name;
    if (biography !== undefined) this._biography = biography;
    if (category !== undefined) this._category = category;
    this._hasInfo = !!(this._name || this._biography);
    this._updatedAt = new Date();
  }

  enableUser(): void {
    this._enable = true;
    this._updatedAt = new Date();
  }

  disableUser(): void {
    this._enable = false;
    this._updatedAt = new Date();
  }

  private validateUser(): void {
    if (!this._id) {
      throw new Error('User ID is required');
    }
  }

  static create(id: string, props: Partial<User> = {}): User {
    return new User(
      id,
      props.name,
      props.biography,
      props.json,
      props.nbFollowers,
      props.nbFollowings,
      props.nbPublications,
      props.instagramId,
      props.facebookId,
      props.category,
      props.externalUrl,
      props.profileUrl,
      props.hasInfo,
      props.hasFollowerProcess,
      props.hasFollowingProcess,
      props.enable,
      props.maxIdFollower,
      props.maxIdFollowing,
      props.createdAt,
      props.updatedAt,
    );
  }
}
