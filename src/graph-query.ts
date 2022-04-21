import { ArrayExpression, matches } from "@garrettmk/ts-match";
import { EntityQuery, matchesEntityQuery, MaybeArray, pick, omit, ValidationError, EntityQueryFields } from "./common";
import { Node, Graph, NodeType, RelatedType, RelationsForType } from "./graph-types";
import { getNode, getRelation, getRelationsForType, parseRelation } from './graph-utils';


// A query has a type field, query fields for each value of that type,
// and query fields for each relation on that type
export type Query<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & Pick<TN, 'type'> 
  & ValueQueryFields<TN>
  & RelationQueryFields<TGraph, TN>;

// Same as above, without the type
export type NodeQueryFields<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & ValueQueryFields<TN>
  & RelationQueryFields<TGraph, TN>;

// An optional query field for each value on the node type
// export type ValueQueryFields<TN extends Node> = {
//   [key in keyof TN as key extends 'type' ? never : key]?: ValueQueryField<TN[key]>
// }
export type ValueQueryFields<TN extends Node> = EntityQueryFields<TN>

// A query field for each relation on the node type
export type RelationQueryFields<TGraph extends Graph, TN extends NodeType<TGraph>> = {
  [key in keyof RelationsForType<TGraph, TN>]?: RelationQueryField<TGraph, TN, key>
}

// For relations, we can either use an ArrayOperator to match against the collection
// itself, or an array of subqueries for appropriate type
export type RelationQueryField<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN> = keyof RelationsForType<TGraph, TN>> =
  | ArrayExpression<never>
  | NodeQueryFields<TGraph, RelatedType<TGraph, TN, key>>[];


  

// Return a list of nodes matching a query
export function findNodes<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, query: MaybeArray<Query<TGraph, TN>>): TN[] {
  if (Array.isArray(query))
    return query.flatMap(q => findNodes(graph, q));

  return graph.nodes.filter(node => matchesNodeQuery(graph, node, query)) as TN[];
}

// Return the EntityQuery portion of a query
export function getEntityQueryFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: NodeQueryFields<TGraph>): EntityQuery<NodeType<TGraph>> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const entityQuery = omit(input, relationKeys);
  return entityQuery as EntityQuery<NodeType<TGraph>>;
}

// Return the relation query fields portion of a query
export function getRelationQueryFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: NodeQueryFields<TGraph>): RelationQueryFields<TGraph, NodeType<TGraph>> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const relationFields = pick(input, relationKeys);
  return relationFields;
}

// Return true if the node matches all fields
export function matchesRelationQueryFields<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>, fields: RelationQueryFields<TGraph, NodeType<TGraph>>): boolean {
  return Object.entries(fields).every(([key, relationQueryField]) => 
    matchesRelationQueryField(graph, node, key, relationQueryField!)
  );
}

// Return true if the node matches the given field
export function matchesRelationQueryField<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>, key: string, field: RelationQueryField<TGraph, NodeType<TGraph>>): boolean {
  const relatedNodes = getRelatedNodes(graph, node, key);

  if (Array.isArray(field))
    return relatedNodes.some(relNode => field.some(nodeQuery => 
      matchesNodeQuery(graph, relNode, nodeQuery)
    ));

  return matchesCollectionOperator(relatedNodes, field);
}

// Return a list of all nodes related through a given key
export function getRelatedNodes<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>, relationKey: string): NodeType<TGraph>[] {
  const relation = getRelation(graph, node.type, relationKey);
  const { direction, otherDirection, relatedType, edgeType } = parseRelation(relation);
  const result: NodeType<TGraph>[] = [];

  graph.edges.forEach(edge => {
    const relatedNode = getNode(graph, edge[direction]);

    if (
      edgeType && (edge.type !== edgeType) ||
      edge[otherDirection] !== node.id ||
      relatedNode.type !== relatedType
    )
      return;

    result.push(relatedNode);
  });

  return result;
}

// Return true if the node matches the query
export function matchesNodeQuery<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>, nodeQuery: NodeQueryFields<TGraph>): boolean {
  const entityQuery = getEntityQueryFields(graph, node.type, nodeQuery);
  const relationQueryFields = getRelationQueryFields(graph, node.type, nodeQuery);

  return matchesEntityQuery(node, entityQuery) && matchesRelationQueryFields(graph, node, relationQueryFields);
}

// Returns true if the list of related nodes is matched by the operator
export function matchesCollectionOperator(collection: any[], operator: ArrayExpression<never>): boolean {
  // @ts-ignore
  return matches(collection, operator);
}