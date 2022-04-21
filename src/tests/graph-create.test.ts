import { create, CreateInput, Edge, Graph, hasEdge, hasNode, Node } from "..";


interface TestNode extends Node {
  type: 'node',
  value: number
};

interface TestEdge extends Edge {
  type: 'tests'
};

const testRelations = {
  node: {
    tests: { to: 'node', type: 'tests' },
    testers: { from: 'node', type: 'tests' }
  }
} as const;

type TestRelations = typeof testRelations;
type TestGraph = Graph<TestNode, TestEdge, TestRelations>;


describe('testing create()', () => {
  const baseGraph: TestGraph = {
    nodes: [],
    edges: [],
    relations: testRelations
  };

  it('create a single node from a simple input', () => {
    const input: CreateInput<TestGraph, TestNode> = {
      id: 'one',
      type: 'node',
      value: 5
    };

    const result = create<TestGraph, TestNode>(baseGraph, input);

    expect(hasNode(result, input)).toBe(true);
  });

  it('creates multiple nodes from an array input', () => {
    const nodeOne: TestNode = {
      id: 'one',
      type: 'node',
      value: 1
    };

    const nodeTwo: TestNode = {
      id: 'two',
      type: 'node',
      value: 2
    };

    const result = create<TestGraph, TestNode>(baseGraph, [nodeOne, nodeTwo]);

    expect(hasNode(result, nodeOne)).toBe(true);
    expect(hasNode(result, nodeTwo)).toBe(true);
  });

  it('creates nodes and edges from a nested input', () => {
    const nodeOne: TestNode = {
      id: 'one',
      type: 'node',
      value: 1
    };

    const nodeTwo: TestNode = {
      id: 'two',
      type: 'node',
      value: 2
    };

    const input: CreateInput<TestGraph> = {
      ...nodeOne,
      tests: nodeTwo
    };

    const result = create<TestGraph, TestNode>(baseGraph, input);

    expect(hasNode(result, nodeOne)).toBe(true);
    expect(hasNode(result, nodeTwo)).toBe(true);
    expect(hasEdge(result, {
      from: 'one',
      to: 'two',
      type: 'tests'
    })).toBe(true);
  });

  it('creates edges using a ref', () => {
    const nodeOne: TestNode = {
      id: 'one',
      type: 'node',
      value: 1
    };

    const nodeTwo: TestNode = {
      id: 'two',
      type: 'node',
      value: 2
    };

    const input: CreateInput<TestGraph, TestNode> = [
      {
        ...nodeOne,
        tests: [{
          id: 'two'
        }]
      },
      nodeTwo
    ];

    const result = create<TestGraph, TestNode>(baseGraph, input);

    expect(hasNode(result, nodeOne)).toBe(true);
    expect(hasNode(result, nodeTwo)).toBe(true);
    expect(hasEdge(result, {
      from: 'one',
      to: 'two',
      type: 'tests'
    }));
  });
});