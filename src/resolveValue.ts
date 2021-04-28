import { isPlainObject } from 'lodash'
import { nestedMap, ResolverCandidate } from '@orioro/nested-map'
import { ResolvedSchema, ResolveValueContext } from './types'

const _resolveUndefinedAndNull = (schema, context, resolve) => {
  if (context.value === null) {
    return null
  } else if (context.value === undefined) {
    return schema.default === undefined
      ? null
      : resolve(schema, {
          ...context,
          value: schema.default,
        })
  } else {
    return resolve(schema, context)
  }
}

const _valueResolver = (types, resolve): ResolverCandidate => [
  (schema) => isPlainObject(schema) && types.includes(schema.type),
  (schema, context) => _resolveUndefinedAndNull(schema, context, resolve),
]

/**
 * @function objectValueResolver
 */
export const objectValueResolver = (
  objectTypes = ['object']
): ResolverCandidate =>
  _valueResolver(objectTypes, (schema, context) => {
    const { value } = context

    if (isPlainObject(value)) {
      return isPlainObject(schema.properties)
        ? Object.keys(schema.properties).reduce((acc, key) => {
            return {
              ...acc,
              [key]: resolveValue(context, schema.properties[key], value[key]),
            }
          }, {})
        : {} // no known properties properties
    } else {
      return value
    }
  })

const _nItemsArray = (n, itemValue) => Array(n).fill(itemValue)

/**
 * @function arrayValueResolver
 */
export const arrayValueResolver = (arrayTypes = ['array']): ResolverCandidate =>
  _valueResolver(arrayTypes, (schema, context) => {
    const { value } = context
    if (Array.isArray(value)) {
      return isPlainObject(schema.items)
        ? value.map((item) => resolveValue(context, schema.items, item))
        : Array.isArray(schema.items)
        ? schema.items.map((itemSchema, index) =>
            resolveValue(context, itemSchema, value[index])
          )
        : _nItemsArray(value.length, null) // no items defined
    } else {
      return value
    }
  })

/**
 * @function defaultValueResolver
 */
export const defaultValueResolver = (
  types = ['string', 'number', 'boolean', 'date']
): ResolverCandidate => [
  (schema, context) => {
    if (!types.includes(schema.type)) {
      throw new Error(`Unknown type ${schema && schema.type}`)
    }

    return _resolveUndefinedAndNull(
      schema,
      context,
      (postUndefNullSchema, postUndefNullContext) => postUndefNullContext.value
    )
  },
]

export const resolveValue = (
  context: ResolveValueContext,
  resolvedSchema: ResolvedSchema,
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): any =>
  nestedMap(resolvedSchema, {
    ...context,
    value,
  })
