import {
  EvaluationContext,
  ExpressionInterpreter,
  Expression,
  $$VALUE,
  evaluate,
} from '@orioro/expression'

const defaultGetType = (value) => undefined // eslint-disable-line @typescript-eslint/no-unused-vars

export type GetTypeInterface = (value: any) => string | void

export const schemaTypeExpression = (
  getType: GetTypeInterface = defaultGetType
): ExpressionInterpreter => (
  context: EvaluationContext,
  valueExp: Expression = $$VALUE
) => {
  const value = evaluate(context, valueExp)
  let type = getType(value)

  if (typeof type === 'string') {
    return type
  } else {
    type = typeof value

    if (type === 'object') {
      if (Array.isArray(type)) {
        return 'list'
      } else {
        return 'map'
      }
    } else {
      return type
    }
  }
}
