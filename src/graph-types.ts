import { DiscriminateUnion, Entity, ID, OneKey } from '@/common';

// A node has an ID, a type, and optionally data
export type Node = 
  & Entity 
  & { type: string }
  & { [key: string]: any }

// An edge has a "from" ID, a "to" ID, and a type
export type Edge = {
  from: ID,
  to: ID,
  type: string
}

// We can describe the relationships between nodes using a map,
// e.g. { authors: { documents: { to: 'document', type: 'writes' } }
// export type Relations<TGraph extends Graph> = {
//   [NodeTypeKey in NodeType<TGraph>['type']]: NodeRelations<TGraph>
// }
export type Relations<TNode extends Node, TEdge extends Edge> = Record<TNode['type'], NodeRelations<TNode, TEdge>>

// Relations for a type are described using a map of a property
// key to a relation descriptor
// export type NodeRelations<TGraph extends Graph> = {
//   [RelationKey: string]: Relation<TGraph>
// }
export type NodeRelations<TNode extends Node, TEdge extends Edge> = Record<string, Relation<TNode, TEdge>>

// A relation descriptor includes the direction (from/to), the type
// of node to relate to, and the type of edge to use
export type Relation<TNode extends Node = Node, TEdge extends Edge = Edge> = 
  | FromRelation<TNode, TEdge> 
  | ToRelation<TNode, TEdge>;

export type FromRelation<TNode extends Node = Node, TEdge extends Edge = Edge> = {
  from: TNode['type'],
  type?: TEdge['type']
}

export type ToRelation<TNode extends Node = Node, TEdge extends Edge = Edge> = {
  to: TNode['type'],
  type?: TEdge['type']
}

// The same info, in a format that is easier to work with (but
// less convenient to write)
export type ParsedRelation<TGraph extends Graph = Graph> = {
  direction: 'to' | 'from',
  otherDirection: 'to' | 'from',
  relatedType: NodeType<TGraph>['type'],
  edgeType: EdgeType<TGraph>['type']
}

// A graph is a collection of nodes, a collection of edges, and an object
// that describes the relationships between the types
export type Graph<
  TNode extends Node = Node, 
  TEdge extends Edge = Edge, 
  TRelations extends Relations<TNode, TEdge> = Relations<TNode, TEdge>
> = {
  nodes: TNode[],
  edges: TEdge[],
  relations: TRelations
}


// Utility types

export type NodeRef = OneKey<'id', ID>;

export type NodeType<TGraph extends Graph> = TGraph['nodes'][0];
export type EdgeType<TGraph extends Graph> = TGraph['edges'][0];
export type RelationsType<TGraph extends Graph> = TGraph['relations'];

export type SpecificNodeType<TGraph extends Graph, TypeKey extends string> = DiscriminateUnion<NodeType<TGraph>, 'type', TypeKey>;
export type SpecificEdgeType<TGraph extends Graph, TypeKey extends string> = DiscriminateUnion<EdgeType<TGraph>, 'type', TypeKey>;
export type RelationsForType<TGraph extends Graph, TN extends NodeType<TGraph>> = RelationsType<TGraph>[TN['type']];
export type SpecificRelation<TGraph extends Graph, TN extends NodeType<TGraph>, PropKey extends keyof RelationsForType<TGraph, TN>> = RelationsForType<TGraph, TN>[PropKey];

export type RelatedTypeKey<R> =
  R extends FromRelation ? R['from'] :
  R extends ToRelation ? R['to'] :
  never;

export type RelatedType<TGraph extends Graph, TN extends NodeType<TGraph>, key extends keyof RelationsForType<TGraph, TN>> = 
  SpecificNodeType<TGraph, RelatedTypeKey<SpecificRelation<TGraph, TN, key>>>;











