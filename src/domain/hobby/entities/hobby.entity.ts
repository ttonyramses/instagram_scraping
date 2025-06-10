export class Hobby {
  constructor(
    private readonly _id: number,
    private _name: string,
  ) {
    this.validateHobby();
  }

  get id(): number { return this._id; }
  get name(): string { return this._name; }

  updateName(name: string): void {
    this._name = name;
  }

  private validateHobby(): void {
    if (!this._name) {
      throw new Error('Hobby name is required');
    }
  }

  static create(id: number, name: string): Hobby {
    return new Hobby(id, name);
  }
}
