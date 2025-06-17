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
  get id(): string {
    return this._id;
  }

  get name(): string | null {
    return this._name ?? null;
  }

  get biography(): string | null {
    return this._biography ?? null;
  }

  get json(): object | null {
    return this._json ?? null;
  }

  get nbFollowers(): number | null {
    return this._nbFollowers ?? null;
  }

  get nbFollowings(): number | null {
    return this._nbFollowings ?? null;
  }

  get nbPublications(): number | null {
    return this._nbPublications ?? null;
  }

  get instagramId(): number | null {
    return this._instagramId ?? null;
  }

  get facebookId(): number | null {
    return this._facebookId ?? null;
  }

  get category(): string | null {
    return this._category ?? null;
  }

  get externalUrl(): string | null {
    return this._externalUrl ?? null;
  }

  get profileUrl(): string | null {
    return this._profileUrl ?? null;
  }

  get hasInfo(): boolean {
    return this._hasInfo;
  }

  // AJOUT DES SETTERS pour permettre à TypeORM d'assigner les valeurs
  set hasInfo(value: boolean) {
    this._hasInfo = value;
  }

  get hasFollowerProcess(): boolean {
    return this._hasFollowerProcess;
  }

  set hasFollowerProcess(value: boolean) {
    this._hasFollowerProcess = value;
  }

  get hasFollowingProcess(): boolean {
    return this._hasFollowingProcess;
  }

  set hasFollowingProcess(value: boolean) {
    this._hasFollowingProcess = value;
  }

  get enable(): boolean {
    return this._enable;
  }

  set enable(value: boolean) {
    this._enable = value;
  }

  get maxIdFollower(): string | null {
    return this._maxIdFollower ?? null;
  }

  set maxIdFollower(value: string | null) {
    this._maxIdFollower = value;
  }

  get maxIdFollowing(): string | null {
    return this._maxIdFollowing ?? null;
  }

  set maxIdFollowing(value: string | null) {
    this._maxIdFollowing = value;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }

  // Setters pour les autres propriétés également
  set name(value: string | null) {
    this._name = value;
  }

  set biography(value: string | null) {
    this._biography = value;
  }

  set json(value: object | null) {
    this._json = value;
  }

  set nbFollowers(value: number | null) {
    this._nbFollowers = value;
  }

  set nbFollowings(value: number | null) {
    this._nbFollowings = value;
  }

  set nbPublications(value: number | null) {
    this._nbPublications = value;
  }

  set instagramId(value: number | null) {
    this._instagramId = value;
  }

  set facebookId(value: number | null) {
    this._facebookId = value;
  }

  set category(value: string | null) {
    this._category = value;
  }

  set externalUrl(value: string | null) {
    this._externalUrl = value;
  }

  set profileUrl(value: string | null) {
    this._profileUrl = value;
  }

  // Méthodes métier
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
      throw new Error('user ID is required');
    }
  }

  static create(id: string, props: Partial<User> = {}): User {
    const user = new User(id);

    // Assignation via les setters
    if (props.name !== undefined) user.name = props.name;
    if (props.biography !== undefined) user.biography = props.biography;
    if (props.json !== undefined) user.json = props.json;
    if (props.nbFollowers !== undefined) user.nbFollowers = props.nbFollowers;
    if (props.nbFollowings !== undefined)
      user.nbFollowings = props.nbFollowings;
    if (props.nbPublications !== undefined)
      user.nbPublications = props.nbPublications;
    if (props.instagramId !== undefined) user.instagramId = props.instagramId;
    if (props.facebookId !== undefined) user.facebookId = props.facebookId;
    if (props.category !== undefined) user.category = props.category;
    if (props.externalUrl !== undefined) user.externalUrl = props.externalUrl;
    if (props.profileUrl !== undefined) user.profileUrl = props.profileUrl;
    if (props.hasInfo !== undefined) user.hasInfo = props.hasInfo;
    if (props.hasFollowerProcess !== undefined)
      user.hasFollowerProcess = props.hasFollowerProcess;
    if (props.hasFollowingProcess !== undefined)
      user.hasFollowingProcess = props.hasFollowingProcess;
    if (props.enable !== undefined) user.enable = props.enable;
    if (props.maxIdFollower !== undefined)
      user.maxIdFollower = props.maxIdFollower;
    if (props.maxIdFollowing !== undefined)
      user.maxIdFollowing = props.maxIdFollowing;
    if (props.createdAt !== undefined) user.createdAt = props.createdAt;
    if (props.updatedAt !== undefined) user.updatedAt = props.updatedAt;

    return user;
  }
}
