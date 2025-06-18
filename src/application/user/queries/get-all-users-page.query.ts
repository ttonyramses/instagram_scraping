import { PaginateQuery } from 'nestjs-paginate';
export class GetAllUsersPageQuery {
  constructor(public readonly paginateQuery: PaginateQuery) {}
}
