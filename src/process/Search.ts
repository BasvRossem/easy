import { Repo, Struct } from '../domain';
import { Id, isDefined, JsonValue, list, List } from '../types';
import { choose, resolve } from '../utils';

export class Search<T extends Struct> {
  constructor(protected repo: Repo<T>) {}

  all = (): Promise<List<T>> => this.repo.all();
  byId = (id: Id): Promise<T> => this.repo.byId(id);
  search = (query: JsonValue): Promise<List<T>> => {
    return choose<Promise<List<T>>, JsonValue>(query)
      .case(
        q => isDefined(q),
        q => this.repo.search(q)
      )
      .else(resolve(list()));
  };
  exists = (id: Id): Promise<boolean> => this.repo.exists(id);
}
