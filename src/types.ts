import { Expression } from '@orioro/expression'
import { ValidationErrorSpec } from '@orioro/validate'
import { Node, NodeCollector } from '@orioro/tree-collect-nodes'
import { ResolverCandidate } from '@orioro/nested-map'

/**
 * @typedef {Expression | Object} UnresolvedSchema
 */
export type UnresolvedSchema =
  | Expression
  | {
      type: string | Expression
      enum?: any[] | Expression
      errors?: { [key: string]: ValidationErrorSpec } | Expression
      [key: string]: any
    }

/**
 * @typedef {Object} ResolvedSchema
 */
export type ResolvedSchema = {
  type: string
  enum?: any[]
  errors?: { [key: string]: ValidationErrorSpec }
  [key: string]: any
}

/**
 * @typedef {Object} ValidationSpec
 */
export type ValidationSpec = Node & {
  validationExpression: Expression
}

/**
 * @typedef {String} BuiltInType
 */
export type BuiltInType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'

export { ValidationErrorSpec, ResolverCandidate, NodeCollector }
