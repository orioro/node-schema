import { isPlainObject, get } from 'lodash'

import {
  cascadeExec,
  test
} from '@orioro/cascade'

import {
  ResolverCandidate,

  nestedMap,
  objectResolver,
  arrayResolver,
} from '@orioro/nested-map'

import {
  ExpressionInterpreter,

  evaluate,
  isExpression,
  ALL_EXPRESSIONS
} from '@orioro/expression'

const schemaExpressionResolver = ({
  interpreters
}):ResolverCandidate => ([
  (schemaValue) => (
    isExpression(interpreters, schemaValue)
  ),
  (schemaExpressionOrValue, options) => {
    const postEvaluation = evaluate({
      interpreters,
      data: {
        $$VALUE: options.value
      }
    }, schemaExpressionOrValue)

    return (
      isPlainObject(postEvaluation) ||
      Array.isArray(postEvaluation)
    )
      ? resolveSchema(postEvaluation, options)
      : postEvaluation
  }
])

export const resolveSchema = (
  schema,
  options: {
    interpreters?: { [key:string]: ExpressionInterpreter },
    value: any
  }
) => {
  return nestedMap(schema, {
    ...options,
    resolvers: [
      schemaExpressionResolver({
        interpreters: options.interpreters || ALL_EXPRESSIONS
      }),
      objectResolver(),
      arrayResolver(),
    ]
  })
}
