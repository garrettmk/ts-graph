import { ID, Entity, EntityQuery, EntityQueryOperator, ParsedQueryOperator } from "@/common";
import { ValidationError, NotImplementedError } from "@/common/common-errors";


export function isId(value: any) : value is ID {
  return typeof value === 'string';
}

export function isIdList(value: any) : value is ID[] {
  return Array.isArray(value) && (typeof value[0] === 'string' || value.length === 0);
}

export function isEntityQuery(value: any) : value is EntityQuery<any> {
  return (Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null)
    || (typeof value === 'object' && !Array.isArray(value) && value !== null);
}


// Match an Entity against an EntityQuery
export function matchesEntityQuery<TEntity extends Entity>(entity: TEntity, query: EntityQuery<TEntity>) : boolean {
  if (Array.isArray(query)) {
    const results = query.map(subquery => matchesEntityQuery(entity, subquery));
    return results.some(Boolean);
  }

  return Object.entries(query).reduce<boolean>(
    (result, [key, queryField]) => result && matchesEntityQueryField(queryField, entity[key as keyof TEntity]),
    true
  );
}


// Match a value against a query directive (a value, an array of values, or a QueryOperator)
function matchesEntityQueryField<T>(queryField: T | T[] | EntityQueryOperator<T>, value: T) : boolean {
  if (Array.isArray(queryField)) {
    return queryField.some(x => x === value);
  }
  
  else if (typeof queryField !== 'object' || queryField === null) {
    return value === queryField; 
  }

  else if (typeof queryField === 'object') {
    const [opKey, opDir] = Object.entries(queryField as EntityQueryOperator<T>)[0];
    switch (opKey as keyof EntityQueryOperator<T>) {
      case 'not':
        return value !== opDir;
    }
  }

  throw new ValidationError(`Invalid query field: ${queryField}`, ['0'], ['primitive', 'array', 'QueryOperator'], queryField);
}

// Return true if a value matches against an operator
export function matchesOperator(value: any, operator: EntityQueryOperator) : boolean {
  const { key, rvalue } = parseOperator(operator);

  switch (key) {
    case 'eq':
      return value === rvalue;

    case 'ne':
      return value !== rvalue;

    case 'lt':
      return value < rvalue;

    case 'lte':
      return value <= rvalue;

    case 'gt':
      return value > rvalue;

    case 'gte':
      return value >= rvalue;

    case 're':
      return (rvalue as RegExp).test(value);

    case 'empty':
      return (value as any[]).length === 0 && rvalue;

    case 'length': {
      const length = (value as any[]).length;
      if (typeof rvalue === 'object' && rvalue !== null)
        return matchesOperator(length, rvalue);
      else
        return length === rvalue;
    }

    case 'includes':
      return (value as any[]).includes(rvalue);

    default:
      throw new NotImplementedError(`Unknown operator: ${JSON.stringify(operator)}`);
  }
}

// Put an operator into a more convienent form to work with
export function parseOperator<TOp extends EntityQueryOperator<any>>(operator: TOp) : ParsedQueryOperator<TOp> {
  const entries = objectEntries(operator);
  if (entries.length !== 1)
    throw new ValidationError(`Not a valid operator: ${JSON.stringify(operator)}`, ['0'], 'ValueQueryOperator<any>', operator);

  return {
    key: entries[0],
    rvalue: entries[1]
  } as unknown as ParsedQueryOperator<TOp>;
}


// A version of Object.entries() with better type support
// export type Entry<T extends {}, K extends keyof T = keyof T> =
//   K extends number ? never :
//   K extends symbol ? never :
//   K extends keyof T ? [K, T[K]] : never;
export type Entry<T extends {}, K extends keyof T = keyof T> = [K, T[K]]

export type Entries<T extends {}> = Entry<T>[];

export function objectEntries<T extends {}>(obj: T) : Entries<T> {
  return Object.entries(obj) as unknown as Entries<T>;
}


// Split an object into two
export function splitObject<T extends {}, TK extends keyof T>(obj: T, keys: TK[]) : [Pick<T, TK>, Omit<T, TK>] {
  const entries = Object.entries(obj);
  const kept = Object.fromEntries(entries.filter(([key]) => keys.includes(key as TK))) as Pick<T, TK>;
  const other = Object.fromEntries(entries.filter(([key]) => !keys.includes(key as TK))) as Omit<T, TK>;

  return [kept, other];
}
