import { isPlainObject } from 'lodash'
import {
  ResolverCandidate,
  nestedMap,
  objectResolver,
  arrayResolver,
  defaultResolver,
} from '@orioro/nested-map'

import {
  evaluateSync,
  isExpression,
  interpreterList,
  ALL_EXPRESSIONS,
} from '@orioro/expression'

import {
  UnresolvedSchema,
  ResolvedSchema,
  ResolveSchemaContext,
  SchemaResolverExperssionOptions,
} from './types'

/**
 * @function schemaResolverFunction
 */
export const schemaResolverFunction = (): ResolverCandidate => [
  (value) => typeof value === 'function',
  (func, context) => func(context.value),
]

const SKIP_NESTED_RESOLUTION_KEYS = ['items', 'validation']

/**
 * @function schemaResolverExpression
 */
export const schemaResolverExpression = ({
  interpreters = interpreterList(ALL_EXPRESSIONS),
  skipKeys = [],
  skipKeysNested = SKIP_NESTED_RESOLUTION_KEYS,
}: SchemaResolverExperssionOptions = {}): ResolverCandidate => [
  (value, context) =>
    skipKeys.length > 0
      ? isExpression(interpreters, value) &&
        !skipKeys.some((key) => context.path.endsWith(key))
      : isExpression(interpreters, value),
  (expression, context) => {
    const value = evaluateSync(
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

/**
 * @function schemaResolverDefault
 */
export const schemaResolverDefault = defaultResolver

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
