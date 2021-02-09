import {
  EvaluationContext,
  Expression,
  $$VALUE,
  evaluate
} from '@orioro/expression'

const defaultGetType = () => undefined

export const schemaTypeExpression = (getType = defaultGetType) => (
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
