
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
 * A logical operation on a number.
 */
export type NumericOperator =
  | { eq: number }
  | { ne: number }
  | { lt: number }
  | { lte: number }
  | { gt: number }
  | { gte: number };

/**
 * A logical operation on a string.
 */
export type StringOperator =
  | { eq: string }
  | { ne: string }
  | { re: RegExp }
  | { empty: boolean };

/**
 * A logical operation on an array.
 */
export type ArrayOperator<T = any> =
  | { empty: boolean }
  | { length: number | NumericOperator }
  | { includes: T | T[] }

/**
 * A logical operation on anything.
 */
export type GenericOperator<T = any> =
  | { eq: T }
  | { ne: T };

/**
 * A logical operator for a generic value.
 */
export type EntityQueryOperator<T = any> =
  T extends number ? NumericOperator :
  T extends string ? StringOperator : 
  T extends any[] ? ArrayOperator<T[0]> :
  GenericOperator<T>;

/**
 * Any of the various operator keys.
 */
export type EntityQueryOperatorKey<T extends EntityQueryOperator<any> = EntityQueryOperator<any>> =
  T extends EntityQueryOperator<any> ? keyof T : never;

/**
 * An equivalent form of {@link EntityQueryOperator} that is easier to use while
 * processing a query.
 */
export type ParsedQueryOperator<TOp extends EntityQueryOperator<any>, TK extends EntityQueryOperatorKey<TOp> = EntityQueryOperatorKey<TOp>> = {
  key: EntityQueryOperatorKey<TOp>
  rvalue: any
}

/**
 * A query field for some discrete value.
 */
export type ValueQueryField<T> = 
  | T                       // Implies equals
  | T[]                     // Implies equals one of
  | EntityQueryOperator<T>        // An explicit operator

/**
 * A mapping of the fields in a type with the appropriate query operators.
 */
export type EntityQueryFields<TEntity extends Entity> = {
  [key in keyof TEntity]?: ValueQueryField<TEntity[key]>
}

/**
 * A query for matching objects.
 */
export type EntityQuery<TEntity extends Entity> = MaybeArray<EntityQueryFields<TEntity>>;