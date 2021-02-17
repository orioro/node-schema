import { isPlainObject } from 'lodash'
import { nestedMap, ResolverCandidate } from '@orioro/nested-map'
import { ResolvedSchema } from './types'


const _valueResolver = (types, resolve) => ([
  (schema) => (
    isPlainObject(schema) &&
    types.includes(schema.type)
  ),
  (schema, context) => {
    if (context.value === null) {
      return null
    } else if (context.value === undefined) {
      return schema.default === undefined
        ? null
        : resolve(schema, {
            ...context,
            value: schema.default
          })
    } else {
      return resolve(schema, context)
    }
  }
])

export const objectValueResolver = (objectTypes = ['object']) =>
  _valueResolver(objectTypes, (schema, context) => {
    const { value } = context

    if (isPlainObject(value)) {
      return isPlainObject(schema.properties)
        ? Object.keys(schema.properties).reduce((acc, key) => {
            return {
              ...acc,
              [key]: resolveValue(schema.properties[key], {
                ...context,
                value: value[key]
              })
            }
          }, {})
        : {} // no known properties properties
    } else {
      return null
    }
  })

const _nItemsArray = (n, itemValue) => Array(n).fill(itemValue)

export const arrayValueResolver = (arrayTypes = ['array']) => _valueResolver(arrayTypes, (schema, context) => {
  const { value } = context
  if (Array.isArray(value)) {
    return isPlainObject(schema.itemSchema)
      ? value.map(item => resolveValue(schema.itemSchema, {
          ...context,
          value: item
        }))
      : _nItemsArray(value.length, null) // no itemSchema defined
  } else {
    return null
  }
})

export const numberValueResolver = () => _valueResolver(['number'], (schema, { value }) =>
  typeof value === 'number' && !isNaN(value)
    ? value
    : null
)

export const stringValueResolver = () => _valueResolver(['string'], (schema, { value }) => 
  typeof value === 'string'
    ? value
    : null
)

export const booleanValueResolver = () => _valueResolver(['boolean'], (schema, { value }) =>
  typeof value === 'boolean'
    ? value
    : null
)

export const defaultValueResolver = () => ([
  (schema, context) => {
    throw new Error(`Unknown type ${schema && schema.type}`)
  }
])

/**
 * @todo resolveValue Change api: resolveValue(schema, value, context?)
 * @type {[type]}
 */
export const resolveValue =(
  resolvedSchema: ResolvedSchema,
  context
):any => {
  return nestedMap(resolvedSchema, {
    resolvers: [
      objectValueResolver(),
      arrayValueResolver(),
      numberValueResolver(),
      stringValueResolver(),
      booleanValueResolver(),
      defaultValueResolver(),
    ],
    ...context,
  })
}
