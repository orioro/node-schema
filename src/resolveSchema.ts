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
  ALL_EXPRESSIONS
} from '@orioro/expression'

import { UnresolvedSchema, ResolvedSchema, Context } from './types'

export type ResolveSchemaContext = Context & {
  resolvers?: ResolverCandidate[]
}

export const schemaResolverFunction = ():ResolverCandidate => ([
  value => typeof value === 'function',
  (func, context) => func(context.value)
])

export const schemaResolverExperssion = ({
  interpreters
}):ResolverCandidate => ([
  value => isExpression(interpreters, value),
  (expression, context) => {
    const value = evaluate({
      interpreters,
      scope: { $$VALUE: context.value }
    }, expression)

    return (
      isPlainObject(value) ||
      Array.isArray(value)
    )
      ? resolveSchema(value, context)
      : value
  }
])

const OBJECT_SKIP_KEYS = ['validation']
export const schemaResolverObject = (
  skipKeys:string[] = OBJECT_SKIP_KEYS
):ResolverCandidate => (
  objectResolver((keyValue, key) => !skipKeys.includes(key))
)

export const schemaResolverArray = arrayResolver

const DEFAULT_RESOLVERS = [
  schemaResolverExperssion({ interpreters: ALL_EXPRESSIONS }),
  schemaResolverObject(),
  arrayResolver(),
]

export const resolveSchema = (
  schema:UnresolvedSchema,
  context:ResolveSchemaContext
):ResolvedSchema => nestedMap(schema, {
  resolvers: DEFAULT_RESOLVERS,
  ...context
})
