import { addEdge, addNode, Graph, hasEdge, hasNode, hasNodeId, pipe, removeNode } from "..";


describe('testing hasNode()', () => {
  const graph: Graph = {
    nodes: [
      { id: 'one', type: 'node' },
      { id: 'two', type: 'node' }
    ],
    edges: [],
    relations: {}
  };

  it('should return true if the graph contains a node with matching ID', () => {
    const result = hasNode(graph, { id: 'one', type: 'node' });
    expect(result).toBe(true);
  });

  it('should return false if the graph does NOT contain a node with the same ID', () => {
    const result = hasNode(graph, { id: 'three', type: 'node' });
    expect(result).toBe(false);
  });
});


describe('testing hasNodeId()', () => {
  const graph: Graph = {
    nodes: [
      { id: 'one', type: 'node' },
      { id: 'two', type: 'node' }
    ],
    edges: [],
    relations: {}
  };

  it('should return true if the graph contains a node with the same ID', () => {
    const result = hasNodeId(graph, 'one');
    expect(result).toBe(true);
  });

  it('should return false if the graph does NOT contain a node with the same ID', () => {
    const result = hasNodeId(graph, 'three');
    expect(result).toBe(false);
  });
});


describe('testing addNode()', () => {
  const graph: Graph = {
    nodes: [
      { id: 'one', type: 'node' },
      { id: 'two', type: 'node' }
    ],
    edges: [],
    relations: {}
  };

  const nodeTwo = { id: 'two', type: 'node' };
  const nodeThree = { id: 'three', type: 'node' };

  it('should return a graph with that includes the given node', () => {
    const result = addNode(graph, nodeThree);
    expect(hasNode(result, nodeThree)).toBe(true);
  });

  it('should throw an error if the graph already contains a node with a matching ID', () => {
    expect(() => addNode(graph, nodeTwo)).toThrow();
  });
});


describe('testing removeNode()', () => {
  const nodeOne = { id: 'one', type: 'node' };
  const nodeTwo = { id: 'two', type: 'node' };
  const nodeThree = { id: 'three', type: 'node' };

  const oneToTwo = { from: 'one', to: 'two', type: 'edge' };
  const twoToOne = { from: 'two', to: 'one', type: 'edge' };
  const twoToThree = { from: 'two', to: 'three', type: 'edge' };

  const graph: Graph = {
    nodes: [nodeOne, nodeTwo],
    edges: [oneToTwo, twoToOne],
    relations: {}
  };

  it('should return a graph with the specified node removed', () => {
    const result = removeNode(graph, nodeOne);
    expect(hasNode(result, nodeOne)).toBe(false);
  });

  it('should throw an error if the node is not found in the graph', () => {
    expect(() => removeNode(graph, nodeThree)).toThrow();
  });

  it('should remove any edges to the deleted node', () => {
    const result = removeNode(graph, nodeOne);
    expect(hasEdge(result, twoToOne)).toBe(false);
  });

  it('should remove any edge from the deleted node', () => {
    const result = removeNode(graph, nodeOne);
    expect(hasEdge(result, oneToTwo)).toBe(false);
  });

  it('should not delete unrelated nodes', () => {
    const result = removeNode(graph, nodeOne);
    expect(hasNode(result, nodeTwo)).toBe(true);
  });

  it('should not delete unrelated edges', () => {
    const newGraph = pipe(graph,
      g => addNode(g, nodeThree),
      g => addEdge(g, twoToThree)  
    );

    const result = removeNode(newGraph, nodeOne);

    expect(hasEdge(result, twoToThree)).toBe(true);
  });
});