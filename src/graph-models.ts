import { ID } from "./common";
import { Graph, NodeType, RelatedType, RelationsForType } from "./graph-types";
import { getRelatedNodes } from "./graph-query";
import { getNode, getRelationsForType } from "./graph-utils";


export type NodeModel<TGraph extends Graph, TN extends NodeType<TGraph> = NodeType<TGraph>> =
  & { [key in keyof TN]: TN[key] }
  & { [key in keyof RelationsForType<TGraph, TN>]: NodeModel<TGraph, RelatedType<TGraph, TN, key>>[] };



export function toModel<TGraph extends Graph, TN extends NodeType<TGraph>>(graph: TGraph, from: TN | ID) : NodeModel<TGraph, TN> {
    const node = typeof from === 'string'
      ? getNode(graph, from)
      : from;

    const relations = getRelationsForType(graph, node.type);

    return new Proxy(node, {
      ownKeys: (target) => {
        const keys = [
          ...Reflect.ownKeys(node),
          ...Reflect.ownKeys(relations)
        ];
        return keys;
      },

      getOwnPropertyDescriptor: (target, key) => {
        if (key in node || key in relations)
          return {
            writable: false,
            configurable: true,
            enumerable: true,
          };
      },

      defineProperty: (target, key, descriptor) => false,

      get: (target, key, receiver) => {
        if (key === Symbol.toStringTag)
          return `NodeModel<${node.type}>`;

        if (key in node || typeof key !== 'string')
          return node[key as keyof NodeType<TGraph>];

        if (!(key in relations))
          return undefined;

        const relatedNodes = getRelatedNodes(graph, node, key);
        const relatedModels = relatedNodes.map(n => toModel(graph, n));

        return relatedModels;
      },
    }) as unknown as NodeModel<TGraph, TN>
  }