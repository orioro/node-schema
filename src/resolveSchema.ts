import { isPlainObject, get } from 'lodash'
import {
  nestedResolve,
  RESOLVER_OBJECT,
  RESOLVER_ARRAY
} from '@orioro/nested-resolve'

import {
  evaluate,
  isExpression,
  ALL_EXPRESSIONS
} from '@orioro/expression'

const schemaExpressionResolver = () => ([
  (value) => (
    isExpression(ALL_EXPRESSIONS, value)
  ),
  (expressionOrValue, options) => {
    const postEvaluation = evaluate({
      interpreters: ALL_EXPRESSIONS,
      data: {
        $$VALUE: options.value
      }
    }, expressionOrValue)

    return (
      isPlainObject(postEvaluation) ||
      Array.isArray(postEvaluation)
    )
      ? resolveSchema(options, postEvaluation, options.value)
      : postEvaluation
  }
])
export const resolveSchema = (options, schema, value) => {
  return nestedResolve({
    ...options,
    resolvers: [
      schemaExpressionResolver(),
      RESOLVER_OBJECT,
      RESOLVER_ARRAY,
    ],
    value
  }, schema)
}
