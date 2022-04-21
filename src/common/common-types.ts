import type { ExpressionFor, ExpressionMap } from "@garrettmk/ts-match";

/**
 * Narrow a discriminated union by type.
 * 
 * @typeParam T A discriminated union of types
 * @typeParam K The discriminator key of `T`
 * @typeParam V A value of `K`
 * 
 * Example:
 * ```typescript
 * type Dog = { type: 'dog' };
 * type Cat = { type: 'cat' };
 * type Fish = { type: 'fish' };
 * 
 * type Pet = Dog | Cat | Fish;
 * type AlsoDog = DiscriminateUnion<Pet, 'type', 'dog'>;
 */
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = 
  T extends Record<K, V> ? T : never

/**
 * An element, or an array.
 */
export type MaybeArray<T> = T | T[];

/**
 * The element type if `T` is an array, otherwise `T`.
 */
export type MaybeArrayType<T> = T extends (infer Item)[] ? Item : T;


/**
 * An object with a single key/value pair.
 */
export type OneKey<K extends string, V = any> = {
  [P in K]: (Record<P, V> &
      Partial<Record<Exclude<K, P>, never>>) extends infer O
      ? { [Q in keyof O]: O[Q] }
      : never
}[K];

/**
 * An ID.
 */
export type ID = string;

/**
 * An object of key-value pairs, identified with an ID.
 */
export type Entity = 
  & { id: ID }
  & { [key: string]: any };



/**
 * A mapping of the fields in a type with the appropriate query operators.
 */
export type EntityQueryFields<TEntity extends Entity> = ExpressionMap<TEntity>

/**
 * A query for matching objects.
 */
export type EntityQuery<TEntity extends Entity> = ExpressionFor<TEntity>;