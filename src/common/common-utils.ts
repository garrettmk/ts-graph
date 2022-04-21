/**
 * @module
 * 
 * Various utility functions used by `ts-graph`. These are not graph-related.
 */

import { Entity, EntityQuery, ID } from "@/common";
import { matches, MaybeArray } from "@garrettmk/ts-match";


export function isId(value: any) : value is ID {
  return typeof value === 'string' && value.length > 0;
}

export function isIdList(value: any) : value is ID[] {
  return Array.isArray(value) && (typeof value[0] === 'string' || value.length === 0);
}

export function isEntityQuery(value: any) : value is EntityQuery<any> {
  return (Array.isArray(value) && typeof value[0] === 'object' && value[0] !== null)
    || (typeof value === 'object' && !Array.isArray(value) && value !== null);
}


/**
 * @param entity The object to test
 * @param query The query to match
 * @returns True if the object matches the query
 * 
 * *Example:*
 * ```typescript
 * const entity = { id: 'one', name: 'Bob' };
 * const query = { name: { re: /b/i } };
 * 
 * const result = matchesEntityQuery(entity, query);  // true
 * ```
 */
export function matchesEntityQuery<TEntity extends Entity>(entity: TEntity, query: EntityQuery<TEntity>) : boolean {
  return matches(entity, query);
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

export function concatResults<TInput, TOutput>(input: TInput[], fn: (inp: TInput) => TOutput[]) : TOutput[] {
  return input.flatMap(inp => fn(inp));
}

export function maybeConcatResults<TInput, TOutput>(input: MaybeArray<TInput>, fn: (inp: TInput) => TOutput[]) : TOutput[] {
  if (Array.isArray(input))
    return concatResults(input, fn);

  return fn(input);
}