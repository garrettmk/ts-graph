import { ID, MaybeArray, objectEntries, splitObject } from "./common";
import { Edge, Graph, Node, NodeRef, NodeType, RelatedType, RelationsForType } from "./graph-types";
import { addEdge, addNode, getRelation, getRelationsForType, hasNodeId, makeEdge, parseRelation, addType } from './graph-utils';


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



// Returns true if the input is a NodeRef
export function isNodeRef(value: any): value is NodeRef {
  return typeof value === 'object'
    && value !== null
    && Object.keys(value).length === 1
    && 'id' in value
    && typeof value['id'] === 'string';
}



type CreateEdgeCallback = (node: Node) => Edge

export function create<TGraph extends Graph>(graph: TGraph, input: MaybeArray<CreateInput<TGraph>>, createEdge?: CreateEdgeCallback) : TGraph {
  if (Array.isArray(input))
    return input.reduce((result, inp) => create(result, inp, createEdge), graph);

  const { type } = input;
  const createNodeFields = getCreateNodeFields(graph, type, input);
  const createRelationFields = getCreateRelationFields(graph, type, input);
  const node = addId(graph, createNodeFields);
  graph = addNode(graph, node);

  if (createEdge) {
    const edge = createEdge(node);
    graph = addEdge(graph, edge);
  }
  
  return Object.entries(createRelationFields).reduce(
    (result, [key, field]) => {
      if (!field) return result;

      const relation = getRelation(graph, type, key);
      const { relatedType } = parseRelation(relation);
      const input = addType(relatedType, field);
      const createEdge = (relatedNode: NodeType<TGraph>) => makeEdge(node, relation, relatedNode);
      
      return create(result, input, createEdge);
    },
    graph
  );
}


// Create a node from an input
export function addId<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, input: CreateNodeFields<TGraph, TN>) : TN {
  return {
    id: input.id ?? getNewNodeId(graph),
    ...input
  } as TN;
}

// Return a new, unused ID for the graph
export function getNewNodeId(graph: Graph) : ID {
  let count = 1;

  while (hasNodeId(graph, `${count}`))
    count = count + 1;

  return count + '';
}


// Return the node portion of a create input
export function getCreateNodeFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: CreateInput<TGraph>): CreateNodeFields<TGraph> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [, createNodeFields] = splitObject(input, relationKeys);
  return createNodeFields as CreateNodeFields<TGraph>;
}

// Return the relation query fields portion of a query
export function getCreateRelationFields<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], input: CreateInput<TGraph>): CreateRelationFields<TGraph> {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [relationFields] = splitObject(input, relationKeys);
  return relationFields;
}