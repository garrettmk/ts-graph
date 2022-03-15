import { Graph, create, ID, Node, Edge, update, getCreateNodeInputs, getCreateEdgeInputs, CreateInput, MaybeArray, CreateRelationField } from ".";

enum Trick {
  Sit = 'sit',
  Shake = 'shake',
  Roll = 'roll',
}


interface Dog extends Node {
  type: 'dog',
  name: string,
  tricks: Trick[]
}

interface Cat extends Node {
  type: 'cat',
  name: string,
  age: number
}

interface Fish extends Node {
  type: 'fish',
  name: string,
}

interface Human extends Node {
  type: 'human',
  name: string
}

interface Owns extends Edge {
  type: 'owns'
}

interface Likes extends Edge {
  type: 'likes'
}

interface PlaysWith extends Edge {
  type: 'playsWith'
}

interface Chases extends Edge {
  type: 'chases'
}


const petRelations = {
  human: {
    dogs: { to: 'dog', type: 'owns' },
    cats: { to: 'cat', type: 'owns' },
    fish: { to: 'fish', type: 'owns' }
  },
  dog: {
    person: { from: 'human', type: 'owns' },
    friends: { to: 'dog', type: 'playsWith' },
    chases: { to: 'cat', type: 'chases' }
  },
  cat: {
    person: { from: 'human', type: 'owns' },
    friends: { to: 'cat', type: 'playsWith' },
    enemies: { from: 'dog', type: 'chases' }
  },
  fish: {
    person: { from: 'human' },
    enemies: { from: 'cat', type: 'chases' }
  }
} as const;

type PetRelations = typeof petRelations;
type PetNode = Human | Dog | Cat | Fish;
type PetEdge = Owns | Likes | PlaysWith | Chases;
type PetGraph = Graph<PetNode, PetEdge, PetRelations>

const graphBase: PetGraph = {
  nodes: [],
  edges: [],
  relations: petRelations
}

const createInput: CreateInput<PetGraph, Human> = [
  {
    id: 'garrett',
    type: 'human',
    name: 'Garrett Myrick',
    dogs: {
      id: 'chewie',
      name: 'Chewbarka',
      tricks: [],
      friends: [
        { id: 'river' }
      ]
    }
  },
  {
    id: 'abbey',
    type: 'human',
    name: 'Abbey Myrick',
    dogs: [
      { 
        id: 'river',
        type: 'dog',
        name: 'River',
        friends: [
          { id: 'chewie' }
        ]
      },
      {
        id: 'lake',
        name: 'Lake'
      }
    ]
  },
  {
    id: 'leslie',
    type: 'human',
    name: 'Leslie',
    dogs: [{
      id: 'betty',
      name: 'Betty',
      
    }]
  }
];

const dogInput: CreateInput<PetGraph, Dog> = {
  type: 'dog',
  id: 'chewie',
  name: 'Chewbarka',
  tricks: [],
  person: {
    id: 'steve',
  }
}


const graph = create(graphBase, createInput);

console.log(JSON.stringify(graph, null, '  '));