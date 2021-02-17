import {
  EvaluationContext,
  Expression,
  $$VALUE,
  evaluate
} from '@orioro/expression'

const defaultGetType = value => undefined

export type GetTypeInterface = (value: any) => (string | void)

export const schemaTypeExpression = (
  getType:GetTypeInterface = defaultGetType
) => (
  context:EvaluationContext,
  valueExp:Expression = $$VALUE
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
