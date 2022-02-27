import { ID, MaybeArray, objectEntries, splitObject } from './common';
import { Node, RelationsForType, RelatedType } from './graph-types';
import { findNodes, Query, NodeQueryFields } from './graph-query';
import { Graph, NodeType } from './graph-types';
import { addEdge, getRelation, getRelationsForType, makeEdge, parseRelation, removeEdge, replaceNode, addType } from './graph-utils';
import { hasEdge } from '.';


export type UpdateInput<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & Pick<TN, 'type'>
  & UpdateNodeInput<TGraph, TN>;

export type UpdateNodeInput<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & UpdateValueFields<TN>
  & UpdateRelationFields<TGraph, TN>;

export type UpdateValueFields<TN extends Node> = Omit<TN, 'id' | 'type'>;

export type UpdateRelationFields<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> = {
  [key in keyof RelationsForType<TGraph, TN>]?: UpdateRelationField<TGraph, TN, key>
}

export type UpdateRelationField<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN> = keyof RelationsForType<TGraph, TN>> = {
  add?: MaybeArray<NodeQueryFields<TGraph, RelatedType<TGraph, TN, key>>>,
  remove?: MaybeArray<NodeQueryFields<TGraph, RelatedType<TGraph, TN, key>>>
}



export function update<TGraph extends Graph>(graph: TGraph, query: Query<TGraph>, id: ID, updates: UpdateInput<TGraph>): TGraph {
  const nodes = findNodes(graph, query);
  const updateNodeFields = getUpdateNodeFields(graph, query.type, updates);
  const updateRelationsFields = getUpdateRelationFields(graph, query.type, updates);

  graph = nodes.reduce(
    (result, node) => {
      const updatedNode = { ...node, ...updateNodeFields };
      result = replaceNode(result, updatedNode);

      result = objectEntries(updateRelationsFields).reduce(
        (result, [key, updateRelationField]) => {
          const { add, remove } = updateRelationField!;
          const relation = getRelation(graph, updatedNode.type, key);
          const { relatedType } = parseRelation(relation);

          if (add) {
            const subquery = addType(relatedType, add);
            const foundNodes = findNodes(graph, subquery);
            result = foundNodes.reduce(
              (result, foundNode) => {
                const edge = makeEdge(node, relation, foundNode);
                return !hasEdge(result, edge) ? addEdge(result, edge) : result;
              },
              result
            )
          }

          if (remove) {
            const subquery = addType(relatedType, remove);
            const foundNodes = findNodes(graph, subquery);
            result = foundNodes.reduce(
              (result, foundNode) => {
                const edge = makeEdge(node, relation, foundNode);
                return hasEdge(result, edge) ? removeEdge(result, edge) : result;
              },
              result
            )
          }

          return result;
        },
        result
      )

      return result;
    },
    graph
  );

  return graph;
}

// Return the node portion of a create input
export function getUpdateNodeFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: UpdateInput<TGraph>): UpdateNodeInput<TGraph> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [, updateNodeFields] = splitObject(input, relationKeys);
  return updateNodeFields as UpdateNodeInput<TGraph>;
}

// Return the relation query fields portion of a query
export function getUpdateRelationFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: UpdateInput<TGraph>): UpdateRelationFields<TGraph> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [relationFields] = splitObject(input, relationKeys);
  return relationFields;
}