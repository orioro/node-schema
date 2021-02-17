import { isPlainObject } from 'lodash'
import { nestedMap, ResolverCandidate } from '@orioro/nested-map'
import { ResolvedSchema } from './types'

export const objectValueResolver = (
  objectTypes:string[] = ['object']
):ResolverCandidate => ([
  (schema) => (
    isPlainObject(schema) &&
    objectTypes.includes(schema.type)
  ),
  (schema, context) => {
    const value = context.value === undefined
      ? schema.default === undefined
        ? {}
        : schema.default
      : isPlainObject(context.value)
        ? context.value
        : null

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
      : isPlainObject(value)
        ? {} // no known properties properties
        : value // will fail in validation
  }
])

const _nItemsArray = n => Array(n).fill(undefined)

export const arrayValueResolver = (
  listTypes:string[] = ['array']
):ResolverCandidate => ([
  (schema) => (
    isPlainObject(schema) &&
    listTypes.includes(schema.type)
  ),
  (schema, context) => {
    const value = context.value === undefined
      ? schema.default !== undefined
        ? schema.default
        : []
      : Array.isArray(context.value)
        ? context.value
        : null

    return isPlainObject(schema.itemSchema)
      ? value.map(item => resolveValue(schema.itemSchema, {
          ...context,
          value: item
        }))
      : Array.isArray(value)
        ? _nItemsArray(value.length) // no itemSchema defined
        : value // will fail in validation
  }
])

const _valueResolver = (types, coerceValue) => ([
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
        : schema.default
    } else {
      return coerceValue(context.value)
    }
  }
])

export const numberValueResolver = () => _valueResolver(['number'], value => {
  switch (typeof value) {
    case 'string':
      return parseFloat(value)
    case 'number':
      return value
    default:
      return null
  }
})

export const stringValueResolver = () => _valueResolver(['string'], value => {
  switch (typeof value) {
    case 'string':
      return value
    case 'number':
    case 'boolean':
      return String(value)
    default:
      return null
  }
})

export const booleanValueResolver = () => _valueResolver(['boolean'], value => Boolean(value))

export const defaultValueResolver = () => ([
  (schema, context) => {
    if (context.value === undefined) {
      return schema.default === undefined
        ? null
        : schema.default
    } else {
      return context.value
    }
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
