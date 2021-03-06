import { Query } from './Query';
import { Table } from './Table';
import { ifGet, Json } from '../types';
import { toClause } from './Clause';

export class Update extends Query {
  constructor(protected table: Table, protected fields: Json) {
    super(table);
  }

  toString(): string {
    return (
      `UPDATE ${this.table} ` +
      `SET ${Object.entries(this.fields)
        .map(([k, v]) => toClause(k, '=', v))
        .join(`, `)} ` +
      `OUTPUT INSERTED.*` +
      ifGet(this.clauses.length, ` WHERE ${this.clauses.join(` AND `)}`, '')
    );
  }
}
