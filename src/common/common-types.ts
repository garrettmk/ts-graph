
// Extract type from a discriminated union by the discriminator key
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = 
  T extends Record<K, V> ? T : never

export type MaybeArray<T> = T | T[];

export type OneKey<K extends string, V = any> = {
  [P in K]: (Record<P, V> &
      Partial<Record<Exclude<K, P>, never>>) extends infer O
      ? { [Q in keyof O]: O[Q] }
      : never
}[K];

export type ID = string;

export type Entity = 
  & { id: ID }
  & { [key: string]: any };

// Some basic query operators
export type NumericOperator =
  | { eq: number }
  | { ne: number }
  | { lt: number }
  | { lte: number }
  | { gt: number }
  | { gte: number };

export type StringOperator =
  | { eq: string }
  | { ne: string }
  | { re: RegExp }
  | { empty: boolean };

export type ArrayOperator<T = any> =
  | { empty: boolean }
  | { length: number | NumericOperator }
  | { includes: T | T[] }

export type GenericOperator<T = any> =
  | { eq: T }
  | { ne: T };

export type EntityQueryOperator<T = any> =
  T extends number ? NumericOperator :
  T extends string ? StringOperator : 
  T extends any[] ? ArrayOperator<T[0]> :
  GenericOperator<T>;

export type EntityQueryOperatorKey<T extends EntityQueryOperator<any> = EntityQueryOperator<any>> =
  T extends EntityQueryOperator<any> ? keyof T : never;

export type ParsedQueryOperator<TOp extends EntityQueryOperator<any>, TK extends EntityQueryOperatorKey<TOp> = EntityQueryOperatorKey<TOp>> = {
  key: EntityQueryOperatorKey<TOp>
  rvalue: any
}

// A field in a query
export type ValueQueryField<T> = 
  | T                       // Implies equals
  | T[]                     // Implies equals one of
  | EntityQueryOperator<T>        // An explicit operator


export type EntityQueryFields<TEntity extends Entity> = {
  [key in keyof TEntity]?: ValueQueryField<TEntity[key]>
}

export type EntityQuery<TEntity extends Entity> = 
  | EntityQueryFields<TEntity>
  | EntityQueryFields<TEntity>[]