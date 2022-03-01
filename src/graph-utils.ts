import { RelationsForTypeKey } from ".";
import { AlreadyExistsError, ID, NotFoundError, MaybeArray, splitObject } from "./common";
import { Edge, EdgeType, Graph, Node, NodeType, ParsedRelation, Relation, RelationsForType, RelationsType } from "./graph-types";


function withSameId(node: Node) {
  return (node2: Node) => node2.id === node.id;
}

function notWithSameId(node: Node) {
  return (node2: Node) => node2.id !== node.id;
}

function toOrFrom(node: Node) {
  return (edge: Edge) => edge.to === node.id || edge.from === node.id;
}

function notToOrFrom(node: Node) {
  return (edge: Edge) => edge.to !== node.id && edge.from !== node.id;
}

function replaceArrayElement<T extends any>(array: T[], index: number, value: T) : T[] {
  return [
    ...array.slice(0, index),
    value,
    ...array.slice(index + 1)
  ];
}


// Return true if a node with the same ID already exists in graph
export function hasNode<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>) : boolean {
  return graph.nodes.some(withSameId(node));
}

export function hasNodeId(graph: Graph, id: ID) : boolean {
  return graph.nodes.some(withSameId({ id } as Node));
}

// Add a new node to a graph
export function addNode<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>) : TGraph {
  if (hasNode(graph, node))
    throw new AlreadyExistsError(`Node id: ${node.id}`);
  
  return { ...graph, nodes: [...graph.nodes, node] };
}

// Remove a node from a graph
export function removeNode<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>) : TGraph {
  if (!hasNode(graph, node))
    throw new NotFoundError(`Node ID: ${node.id}`);
  
  return {
    ...graph,
    nodes: graph.nodes.filter(notWithSameId(node)),
    edges: graph.edges.filter(notToOrFrom(node))
  };
}

// Replace a node
export function replaceNode<TGraph extends Graph>(graph: TGraph, node: NodeType<TGraph>) : TGraph {
  const index = graph.nodes.findIndex(n => n.id === node.id);
  if (index < 0)
    throw new NotFoundError(`Node ID: ${node.id}`);

  return {
    ...graph,
    nodes: replaceArrayElement(graph.nodes, index, node)
  };
}

// Return a node by ID
export function getNode<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, id: ID) : TN {
  const node = graph.nodes.find(n => n.id === id);
  if (!node)
    throw new NotFoundError(`Node ID: ${id}`);

  return node as TN;
}


// Return true if an edge with the same fields exists
export function hasEdge(graph: Graph, edge: Edge) : boolean {
  return graph.edges.some(e =>
    e.to === edge.to &&
    e.from === edge.from &&
    e.type === edge.type  
  );
}

// Add an edge
export function addEdge<TGraph extends Graph>(graph: TGraph, edge: EdgeType<TGraph>) : TGraph {
  if (!hasNodeId(graph, edge.to))
    throw new NotFoundError(`Node ID: ${edge.to}`);

  if (!hasNodeId(graph, edge.from))
    throw new NotFoundError(`Node ID: ${edge.from}`);

  if (hasEdge(graph, edge))
    throw new AlreadyExistsError(`Edge: ${JSON.stringify(edge)}`);

  return {
    ...graph,
    edges: [...graph.edges, edge]
  };
}

// Remove an edge
export function removeEdge<TGraph extends Graph>(graph: TGraph, edge: EdgeType<TGraph>) : TGraph {
  if (!hasEdge(graph, edge))
    throw new NotFoundError(`Edge: ${JSON.stringify(edge)}`);
  
  return {
    ...graph,
    edges: graph.edges.filter(e => e.from === edge.from && e.to === edge.to && e.type === edge.type),
  };
}

// Create an edge from two nodes and a relation
export function makeEdge<TGraph extends Graph>(node: NodeType<TGraph>, relation: Relation<NodeType<TGraph>>, relatedNode: NodeType<TGraph>) : EdgeType<TGraph> {
  const { direction, otherDirection, edgeType } = parseRelation(relation);

  return {
    [direction]: relatedNode,
    [otherDirection]: node,
    type: edgeType
  } as EdgeType<TGraph>;
}


// Get the relations for a node type, or an empty object
export function getRelationsForType<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type']) {
  return graph.relations[type] ?? {};
}

// Get a specific relation
export function getRelation<TGraph extends Graph>(graph: TGraph, type: NodeType<TGraph>['type'], key: keyof RelationsType<TGraph>[typeof type]) : Relation<NodeType<TGraph>, EdgeType<TGraph>> {
  return getRelationsForType(graph, type)[key];
}

// Put a relation in a format that's easier to work with
export function parseRelation<TGraph extends Graph>(relation: Relation<NodeType<TGraph>, EdgeType<TGraph>>) : ParsedRelation<TGraph> {
  const direction = 'from' in relation ? 'from' : 'to';
  const otherDirection = direction === 'from' ? 'to' : 'from';
  const relatedType = relation[direction as keyof typeof relation] as NodeType<TGraph>['type'];
  const edgeType = relation.type as EdgeType<TGraph>['type'];

  return { direction, otherDirection, relatedType, edgeType };
}

// Add a "type" parameter to an object or array of objects
export function addType<TIn extends {}, TOut extends { type: string } & TIn>(type: string, input: MaybeArray<TIn>) : MaybeArray<TOut> {
  if (Array.isArray(input))
    return input.map(inp => ({ type, ...inp }) as TOut);

  return { type, ...input } as TOut;
}

// Return just the fields of an object that are listed in the relations
// for that type
export function getRelationFields<TOutput>(graph: Graph, type: string, input: any) : TOutput {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [relationFields] = splitObject(input, relationKeys);
  return relationFields as TOutput;
}

// Return everything BUT the relation fields
export function getNonRelationFields<TOutput>(graph: Graph, type: string, input: any) : TOutput {
  const relationKeys = Object.keys(getRelationsForType(graph, type));
  const [, nonRelationFields] = splitObject(input, relationKeys);
  return nonRelationFields as TOutput;
}