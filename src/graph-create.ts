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



export function create<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, input: CreateInput<TGraph, TN>) : TGraph {
  const createNodeInputs = getCreateNodeInputs(graph, input);
  const createEdgeInputs = getCreateEdgeInputs(graph, input);

  graph = createNodeInputs.reduce(addNode, graph);
  graph = createEdgeInputs.reduce(addEdge, graph);

  return graph;
}


export function getCreateNodeInputs<TGraph extends Graph>(graph: TGraph, input: CreateInput<TGraph>) : NodeType<TGraph>[] {
  if (Array.isArray(input))
    return input.reduce(
      (result, inp) => [...result, ...getCreateNodeInputs(graph, inp)], 
      [] as NodeType<TGraph>[]
    );

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


export function getCreateEdgeInputs<TGraph extends Graph>(graph: TGraph, input: CreateInput<TGraph>, makeEdgeToParent?: CreateEdgeToParentCallback<TGraph>) : EdgeType<TGraph>[] {
  if (Array.isArray(input))
    return input.reduce(
      (result, inp) => [...result, ...getCreateEdgeInputs(graph, inp, makeEdgeToParent)], 
      [] as EdgeType<TGraph>[]
    );
  
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