import { omitRelationFields, pickRelationFields } from '.';
import { MaybeArray } from './common';
import { findNodes, NodeQueryFields, Query } from './graph-query';
import { Graph, Node, NodeType, RelatedType, RelationsForType } from './graph-types';
import { addEdge, addType, getRelation, hasEdge, makeEdge, parseRelation, removeEdge, replaceNode } from './graph-utils';


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

export type UpdateRelationField<
  TGraph extends Graph, 
  TN extends NodeType<TGraph> = NodeType<TGraph>, 
  key extends keyof RelationsForType<TGraph, TN> = keyof RelationsForType<TGraph, TN>
> = {
  add?: MaybeArray<NodeQueryFields<TGraph, RelatedType<TGraph, TN, key>>>,
  remove?: MaybeArray<NodeQueryFields<TGraph, RelatedType<TGraph, TN, key>>>
}



export function update<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, query: Query<TGraph, TN>, updates: UpdateInput<TGraph, TN>): TGraph {
  const nodes = findNodes(graph, query);
  const updateNodeFields = omitRelationFields<UpdateValueFields<NodeType<TGraph>>>(graph, query.type, updates);
  const updateRelationsFields = pickRelationFields<UpdateRelationFields<TGraph>>(graph, query.type, updates);

  graph = nodes.reduce(
    (result, node) => {
      const updatedNode = { ...node, ...updateNodeFields };
      result = replaceNode(result, updatedNode);

      result = Object.entries(updateRelationsFields).reduce(
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