import { EdgeType, isNotNodeRef, omitRelationFields, pickRelationFields } from ".";
import { MaybeArray, ensureArray } from "./common";
import { Graph, NodeRef, NodeType, RelatedType, RelationsForType } from "./graph-types";
import { addEdge, addNode, addType, getRelation, isNodeRef, parseRelation } from './graph-utils';


export type CreateInput<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  MaybeArray<CreateNodeInput<TGraph, TN>>;

export type CreateNodeInput<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & TN
  & CreateRelationFields<TGraph, TN>
  
export type CreateRelationFields<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> = { 
  [key in keyof RelationsForType<TGraph, TN>]?: MaybeArray<CreateRelationField<TGraph, TN, key> | NodeRef>
}

export type CreateRelationField<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN> = keyof RelationsForType<TGraph, TN>> =
  CreateNodeInput<TGraph, RelatedType<TGraph, TN, key>>;


type CreateEdgeToParentCallback<TGraph extends Graph> = (node: NodeType<TGraph>) => EdgeType<TGraph>


/**
 * Create nodes and edges using a convenient JSON input.
 * 
 * @param graph The input graph.
 * @param input An input object describing the nodes and edges to create.
 * @returns A new graph combining the input graph with the created nodes and edges.
 * 
 * Consider the folling graph:
 * ```typescript
 * interface PersonNode extends Node {
 *  type: 'person',
 *  name: string
 * };
 * 
 * interface TrustsEdge extends Edge {
 *  type: 'Trusts'
 * };
 * 
 * const friendRelations = {
 *  person: {
 *    trusts: { to: 'person', type: 'trusts' },
 *  }
 * } as const;
 * 
 * type FriendsRelations = typeof friendRelations;
 * type FriendsNode = PersonNode;
 * type FriendsEdge = TrustsEdge;
 * type FriendsGraph = Graph<FriendsNode, FriendsEdge, FriendsRelations>;
 * 
 * const emptyGraph: FriendsGraph = {
 *  nodes: [],
 *  edges: [],
 *  relations: friendRelations
 * };
 * ```
 * 
 * To add a single node, simply call `create` with the input graph and the node:
 * ```typescript
 * create(emptyGraph, {
 *  id: 'luke',
 *  type: 'person',
 *  name: 'Luke'
 * });
 * ```
 * 
 * To add multiple nodes, use an array:
 * ```typescript
 * create(emptyGraph, [
 *  {
 *    id: 'luke',
 *    type: 'person',
 *    name: 'Luke'
 *  },
 *  {
 *    id: 'obiwan',
 *    type: 'person',
 *    name: 'Obi-Wan'
 *  }
 * ]);
 * ```
 * 
 * You can create an edge to another node (either already existing in the graph, or created by the input)
 * by referencing it's ID:
 * ```typescript
 * create<FriendsGraph, Person>(emptyGraph, [
 *  {
 *    id: 'luke',
 *    type: 'person',
 *    name: 'Luke',
 *    trusts: { id: 'obiwan' }
 *  },
 *  {
 *    id: 'obiwan',
 *    type: 'person',
 *    name: 'Obi-Wan'
 *  }
 * ]);
 * ```
 * 
 * You can also use a more compact syntax:
 * ```typescript
 * create<FriendsGraph, Person>(emptyGraph, {
 *  id: 'luke',
 *  type: 'person',
 *  name: 'Luke',
 *  trusts: {
 *    id: 'obiwan',
 *    name: 'Obi-Wan'
 *  }
 * });
 * ```
 * Note that you don't have to give a `type` property when creating a node through a relation.
 * 
 * Nodes created through relations can themselves create nodes through relations, or edges to existing nodes.
 * We can use this to create a reciprocal relationship:
 * ```typescript
 * create<FriendsGraph, Person>(emptyGraph, {
 *  id: 'luke',
 *  type: 'person',
 *  name: 'Luke',
 *  trusts: {
 *    id: 'obiwan',
 *    name: 'Obi-Wan',
 *    trusts: { id: 'luke' }
 *  }
 * });
 *```
 */
export function create<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, input: CreateInput<TGraph, TN>) : TGraph {
  const createNodeInputs = getCreateNodeInputs(graph, input);
  const createEdgeInputs = getCreateEdgeInputs(graph, input);

  graph = createNodeInputs.reduce(addNode, graph);
  graph = createEdgeInputs.reduce(addEdge, graph);

  return graph;
}


/**
 * @internal
 * @param graph The input graph.
 * @param input The input passed to `create()`.
 * @returns An array of `Node`s to add to the input graph.
 */
export function getCreateNodeInputs<TGraph extends Graph>(graph: TGraph, input: CreateInput<TGraph>) : NodeType<TGraph>[] {
  if (Array.isArray(input))
    return input.flatMap(inp => getCreateNodeInputs(graph, inp));

  const node = omitRelationFields<NodeType<TGraph>>(graph, input.type, input);
  const relationFields = pickRelationFields<CreateRelationFields<TGraph>>(graph, input.type, input);
  
  const relatedNodeFields: CreateNodeInput<TGraph>[] = Object.entries(relationFields).reduce(
    (result, [key, relationField]) => {
      if (!relationField) return result;

      const relation = getRelation(graph, input.type, key);
      const { relatedType } = parseRelation(relation);      
      const createNodeInputs = ensureArray(relationField)
        .filter(isNotNodeRef)
        .map(item => addType(relatedType, item));

      return [...result, ...getCreateNodeInputs(graph, createNodeInputs as CreateInput<TGraph>)];
    },
    [] as CreateNodeInput<TGraph>[]
  );

  return [node, ...relatedNodeFields];
}


/**
 * @internal
 * @param graph The input graph.
 * @param input The `CreateInput`.
 * @param makeEdgeToParent Used when the function calls itself recursively to process relations.
 * @returns An array of `Edge`s to add to the input graph.
 */
export function getCreateEdgeInputs<TGraph extends Graph>(graph: TGraph, input: CreateInput<TGraph>, makeEdgeToParent?: CreateEdgeToParentCallback<TGraph>) : EdgeType<TGraph>[] {
  if (Array.isArray(input))
    return input.flatMap(inp => getCreateEdgeInputs(graph, inp, makeEdgeToParent));
  
  const nodeFields = omitRelationFields<CreateNodeInput<TGraph>>(graph, input.type, input);
  const relationFields = pickRelationFields<CreateRelationFields<TGraph>>(graph, input.type, input);
  const edgeToParent = makeEdgeToParent?.(nodeFields);
  const result: EdgeType<TGraph>[] = edgeToParent ? [edgeToParent] : [];

  return Object.entries(relationFields).reduce(
    (result, [key, relationField]) => {
      if (!relationField) return result;

      const relation = getRelation(graph, input.type, key);
      const { direction, otherDirection, relatedType, edgeType } = parseRelation(relation);
      const relatedInput = addType(relatedType, relationField);

      const makeEdgeToNode: CreateEdgeToParentCallback<TGraph> = inp => ({
        [direction]: inp.id,
        [otherDirection]: nodeFields.id,
        type: edgeType
      }) as EdgeType<TGraph>;

      return [...result, ...getCreateEdgeInputs(graph, relatedInput as CreateInput<TGraph>, makeEdgeToNode)]
    },
    result
  );
}