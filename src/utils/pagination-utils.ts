import { Paginated } from 'nestjs-paginate';

export class PaginationUtils {
  /**
   * Mappe les données d'un résultat paginé d'un type ORM vers un type Domain
   * @param paginatedResult - Le résultat paginé à mapper
   * @param mapper - Fonction de mapping d'un élément ORM vers Domain
   * @returns Le résultat paginé avec les données mappées
   */
  public static mapPaginatedResult<TOrm, TDomain>(
    paginatedResult: Paginated<TOrm>,
    mapper: (orm: TOrm) => TDomain,
  ): { data: any; meta: any; links: any } {
    return {
      data: paginatedResult.data.map(mapper),
      meta: paginatedResult.meta,
      links: paginatedResult.links,
    };
  }

  /**
   * Version asynchrone pour mapper les données d'un résultat paginé
   * @param paginatedResult - Le résultat paginé à mapper
   * @param asyncMapper - Fonction de mapping asynchrone d'un élément ORM vers Domain
   * @returns Promise du résultat paginé avec les données mappées
   */
  public static async mapPaginatedResultAsync<TOrm, TDomain>(
    paginatedResult: Paginated<TOrm>,
    asyncMapper: (orm: TOrm) => Promise<TDomain>,
  ): Promise<{ data: Awaited<unknown>[]; meta: any; links: any }> {
    const mappedData = await Promise.all(paginatedResult.data.map(asyncMapper));

    return {
      data: mappedData,
      meta: paginatedResult.meta,
      links: paginatedResult.links,
    };
  }
}
