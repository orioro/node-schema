import { isPlainObject } from 'lodash'
import {
  ResolverCandidate,
  nestedMap,
  objectResolver,
  arrayResolver,
} from '@orioro/nested-map'

import {
  evaluate,
  isExpression,
  ALL_EXPRESSIONS,
  ExpressionInterpreter,
} from '@orioro/expression'

import { UnresolvedSchema, ResolvedSchema, Context } from './types'

export type ResolveSchemaContext = Context & {
  resolvers?: ResolverCandidate[]
}

export const schemaResolverFunction = (): ResolverCandidate => [
  (value) => typeof value === 'function',
  (func, context) => func(context.value),
]

const SKIP_NESTED_RESOLUTION_KEYS = ['items', 'validation']

type SchemaResolverExperssionOptions = {
  interpreters?: { [key: string]: ExpressionInterpreter }
  skipKeys?: string[]
  skipKeysNested?: string[]
}

export const schemaResolverExperssion = ({
  interpreters = ALL_EXPRESSIONS,
  skipKeys = [],
  skipKeysNested = SKIP_NESTED_RESOLUTION_KEYS,
}: SchemaResolverExperssionOptions = {}): ResolverCandidate => [
  (value, context) =>
    skipKeys.length > 0
      ? isExpression(interpreters, value) &&
        !skipKeys.some((key) => context.path.endsWith(key))
      : isExpression(interpreters, value),
  (expression, context) => {
    const value = evaluate(
      {
        interpreters,
        scope: { $$VALUE: context.value },
      },
      expression
    )

    const shouldResolveNested =
      (isPlainObject(value) || Array.isArray(value)) &&
      (skipKeysNested.length === 0 ||
        !skipKeysNested.some((key) => context.path.endsWith(key)))

    return shouldResolveNested
      ? resolveSchema(value, context.value, context)
      : value
  },
]

export const schemaResolverObject = objectResolver

export const schemaResolverArray = arrayResolver

const DEFAULT_RESOLVERS = [
  schemaResolverExperssion(),
  schemaResolverObject(),
  arrayResolver(),
]

export const resolveSchema = (
  schema: UnresolvedSchema,
  value: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  context: ResolveSchemaContext = {}
): ResolvedSchema =>
  nestedMap(schema, {
    value,
    resolvers: DEFAULT_RESOLVERS,
    ...context,
  })
