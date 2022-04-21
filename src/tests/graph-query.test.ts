import { create, Node, Edge, Graph, findNodes } from '..';

interface Person extends Node {
  type: 'person',
  name: string
  age: number
}

interface KeepsEdge extends Edge {
  type: 'keeps'
}

interface Dog extends Node {
  type: 'dog',
  name: string
  age: number
  tricks: string[]
}

interface PlaysAtEdge extends Edge {
  type: 'playsAt'
}

interface Park extends Node {
  type: 'park'
  name: string
}

const petsGraphRelations = {
  person: {
    pets: { to: 'dog', type: 'keeps' }
  },
  dog: {
    people: { from: 'person', type: 'keeps' },
    parks: { to: 'park', type: 'playsAt' }
  },
  park: {}
} as const;

type PetsGraphRelations = typeof petsGraphRelations;
type PetsGraphNode = Person | Dog | Park;
type PetsGraphEdge = KeepsEdge | PlaysAtEdge;
type PetsGraph = Graph<PetsGraphNode, PetsGraphEdge, PetsGraphRelations>;

describe('testing findNodes()', () => {
  const baseGraph: PetsGraph = { nodes: [], edges: [], relations: petsGraphRelations };
  
  const sneezy: Person = {
    id: '1',
    type: 'person',
    name: 'Sneezy',
    age: 20
  };

  const smiley: Person = {
    id: '2',
    type: 'person',
    name: 'Smiley',
    age: 30,
  };

  const bob: Person = {
    id: '3',
    type: 'person',
    name: 'Bob',
    age: 40
  };

  const rambo: Dog = {
    id: '4',
    type: 'dog',
    name: 'Rambo',
    age: 2,
    tricks: [],
  };

  const fluffy: Dog = {
    id: '5',
    type: 'dog',
    name: 'Fluffy',
    age: 5,
    tricks: ['fly']
  };

  const park: Park = {
    id: '6',
    type: 'park',
    name: 'Park One'
  };

  const graph = create(baseGraph, [
    {
      ...sneezy,
      pets: [ { id: '4' } ]
    },
    {
      ...smiley,
      pets: [ { id: '5' } ]
    },
    bob,
    {
      ...rambo,
      parks: [ { id: '6' } ]
    },
    {
      ...fluffy,
      parks: [ { id: '6' } ]
    },
    park
  ]);

  const includesNode = (array: Node[], node: Node) => array.some(n => n.id === node.id);
  const includesAll = (array: Node[], nodes: Node[]) => nodes.every(n => includesNode(array, n));

  it('should return all nodes of a given type', () => {
    const result = findNodes(graph, {
      type: 'person'
    });

    expect(result.length).toEqual(3);
    expect(includesAll(result, [sneezy, smiley, bob])).toBe(true);
  });

  it('should return the filtered set of nodes', () => {
    const result = findNodes(graph, {
      type: 'person',
      age: { gt: 20 }
    });

    expect(result.length).toBe(2);
    expect(includesAll(result, [smiley, bob])).toBe(true);
  });

  it('should return all nodes through a relation', () => {
    const result = findNodes(graph, {
      type: 'dog',
      people: [{
        id: '1'
      }]
    });

    expect(result.length).toBe(1);
    expect(includesNode(result, rambo));
  });

  it('should return all nodes through two relations', () => {
    // Find all people who have a pet that plays at the park
    const result = findNodes(graph, {
      type: 'person',
      pets: [{
        parks: [{
          id: '6'
        }]
      }]
    });

    expect(result.length).toBe(2);
    expect(includesAll(result, [sneezy, smiley]));
  });
});