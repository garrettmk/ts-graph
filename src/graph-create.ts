import { omitRelationFields, pickRelationFields } from ".";
import { ID, MaybeArray } from "./common";
import { Edge, Graph, Node, NodeRef, NodeType, RelatedType, RelationsForType } from "./graph-types";
import { addEdge, addNode, addType, getRelation, hasNodeId, makeEdge, parseRelation } from './graph-utils';


export type CreateInput<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & Pick<TN, 'type'>
  & CreateValueFields<TN>
  & CreateRelationFields<TGraph, TN>

export type CreateNodeFields<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & CreateValueFields<TN>
  & CreateRelationFields<TGraph, TN>;
  
export type CreateValueFields<TN extends Node> = 
  & Partial<Pick<TN, 'id' | 'type'>>
  & Omit<TN, 'id' | 'type'>;
  
export type CreateRelationFields<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> = { 
  [key in keyof RelationsForType<TGraph, TN>]?: CreateRelationField<TGraph, TN, key>
}

export type CreateRelationField<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN> = keyof RelationsForType<TGraph, TN>> =
  MaybeArray<CreateRelatedNodeInput<TGraph, TN, key> | NodeRef>;

export type CreateRelatedNodeInput<TGraph extends Graph, TN extends NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN>> =
  CreateNodeFields<TGraph, RelatedType<TGraph, TN, key>>;

type CreateEdgeCallback = (node: Node) => Edge



export function create<TGraph extends Graph>(graph: TGraph, input: MaybeArray<CreateInput<TGraph>>, createEdge?: CreateEdgeCallback) : TGraph {
  if (Array.isArray(input))
    return input.reduce((result, inp) => create(result, inp, createEdge), graph);

  const { type } = input;
  const createNodeFields = omitRelationFields<CreateNodeFields<TGraph>>(graph, type, input);
  const createRelationFields = pickRelationFields<CreateRelationFields<TGraph>>(graph, type, input);
  const node = addId(graph, createNodeFields);
  graph = addNode(graph, node);

  if (createEdge) {
    const edge = createEdge(node);
    graph = addEdge(graph, edge);
  }
  
  return Object.entries(createRelationFields).reduce(
    (result, [key, field]) => createRelatedNodes(result, node, key, field),
    graph
  );
}


function createRelatedNodes<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, node: TN, relationKey: keyof RelationsForType<TGraph, TN>, field: CreateRelationField<TGraph, TN>) : TGraph {
  if (!field) return graph;

  const relation = getRelation(graph, node.type, relationKey);
  const { relatedType } = parseRelation(relation);
  const input = addType(relatedType, field);
  const createEdge: CreateEdgeCallback = relatedNode => makeEdge(node, relation, relatedNode);

  // @ts-ignore
  return create(graph, input, createEdge);
}


// Create a node from an input
function addId<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, input: CreateNodeFields<TGraph, TN>) : TN {
  return {
    id: input.id ?? getNewNodeId(graph),
    ...input
  } as TN;
}

// Return a new, unused ID for the graph
function getNewNodeId(graph: Graph) : ID {
  let count = 1;

  while (hasNodeId(graph, `${count}`))
    count = count + 1;

  return count + '';
}


function isNodeRef(value: any): value is NodeRef {
  return typeof value === 'object'
    && value !== null
    && Object.keys(value).length === 1
    && 'id' in value
    && typeof value['id'] === 'string';
}

