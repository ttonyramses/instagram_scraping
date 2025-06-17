export class GetOneUserWithRelationsQuery {
  constructor(
    public readonly id: string,
    public readonly relations?: string[],
  ) {}
}
