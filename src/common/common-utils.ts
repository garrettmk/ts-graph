import { Entity, EntityQuery, EntityQueryOperator, ID, ParsedQueryOperator } from "@/common";
import { NotImplementedError, ValidationError } from "@/common/common-errors";
import { MaybeArray, MaybeArrayType } from "..";


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
    return matchesOperator(value, queryField as EntityQueryOperator<T>);
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
      return ((value as any[]).length === 0) === rvalue;

    case 'length': {
      const length = (value as any[]).length;
      if (typeof rvalue === 'object' && rvalue !== null)
        return matchesOperator(length, rvalue);
      else
        return length === rvalue;
    }

    case 'includes': {
      if (Array.isArray(rvalue))
        return (value as any[]).some(v => rvalue.includes(v));
      else
        return (value as any[]).includes(rvalue);
    }

    default:
      throw new NotImplementedError(`Unknown operator: ${JSON.stringify(operator)}`);
  }
}

// Put an operator into a more convienent form to work with
export function parseOperator<TOp extends EntityQueryOperator<any>>(operator: TOp) : ParsedQueryOperator<TOp> {
  const entries = Object.entries(operator);
  if (entries.length !== 1)
    throw new ValidationError(`Not a valid operator: ${JSON.stringify(operator)}`, ['0'], 'ValueQueryOperator<any>', operator);
  
  const [key, rvalue] = entries[0];

  return { key, rvalue } as unknown as ParsedQueryOperator<TOp>;
}

export function pick<T extends {}, K extends keyof T>(obj: T, keys: Readonly<K[]>) : Pick<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => keys.includes(key as K))
  ) as Pick<T, K>;
}

export function omit<T extends {}, K extends keyof T>(obj: T, keys: Readonly<K[]>) : Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;
}

export function ensureArray<T>(input: T | T[]) : T[] {
  return Array.isArray(input) ? input : [input];
}