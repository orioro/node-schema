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

import { UnresolvedSchema, ResolvedSchema } from './types'

/**
 * @function schemaResolverFunction
 */
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

/**
 * @function schemaResolverExpression
 */
export const schemaResolverExpression = ({
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
      ? resolveSchema(context, value, context.value)
      : value
  },
]

/**
 * @function schemaResolverObject
 */
export const schemaResolverObject = objectResolver

/**
 * @function schemaResolverArray
 */
export const schemaResolverArray = arrayResolver

export type ResolveSchemaContext = {
  resolvers: ResolverCandidate[]
}

/**
 * @function resolveSchema
 */
export const resolveSchema = (
  context: ResolveSchemaContext,
  schema: UnresolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): ResolvedSchema =>
  nestedMap(schema, {
    ...context,
    value,
  })
