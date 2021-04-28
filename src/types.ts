import {
  Expression,
  InterpreterList,
  TypeMap,
  TypeAlternatives,
} from '@orioro/expression'
import { ValidationErrorSpec } from '@orioro/validate'
import {
  Node,
  NodeCollector,
  NodeCollectorContext,
} from '@orioro/tree-collect-nodes'
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
 * @typedef {Object} ResolveSchemaContext
 */
export type ResolveSchemaContext = {
  resolvers: ResolverCandidate[]
}

export type SchemaResolverExperssionOptions = {
  interpreters?: InterpreterList
  skipKeys?: string[]
  skipKeysNested?: string[]
}

export type ResolveValueContext = {
  resolvers: ResolverCandidate[]
}

export type SchemaEnvOptions = {
  types?: TypeMap | TypeAlternatives
  interpreters?: InterpreterList
  schemaResolvers?: ResolverCandidate[]
  valueResolvers?: ResolverCandidate[]
  validationCollectors?: NodeCollector[]
}

/**
 * @typedef {Object} ValidationSpec
 */
export type ValidationSpec = Node & {
  validationExpression: Expression
}

/**
 * @typedef {Object} ParseValidationsContext
 */
export type ParseValidationsContext = NodeCollectorContext & {
  collectors: NodeCollector[]
  resolveSchema: (schema: UnresolvedSchema, value: any) => ResolvedSchema
}

export type ValidateContext = ParseValidationsContext & {
  interpreters: InterpreterList
}

export type ValidateOptions =
  | string[]
  | {
      paths?: string[]
      ignore?: string[]
    }

export type ValidateAsyncOptions = ValidateOptions & {
  mode: 'serial' | 'parallel'
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
