import { isPlainObject, get } from 'lodash'
import { nestedMap, ResolverCandidate } from '@orioro/nested-map'

import {
  ResolvedSchema,
  Context
} from './types'

export const defaultsMapResolver = (
  mapTypes:string[] = ['map']
):ResolverCandidate => ([
  (schema) => (
    isPlainObject(schema) &&
    isPlainObject(schema.properties) &&
    mapTypes.includes(schema.type)
  ),
  (schema, context) => {
    const value = isPlainObject(context.value) ? context.value : {}

    return Object.keys(schema.properties).reduce((acc, key) => {
      return {
        ...acc,
        [key]: applyDefaults(schema.properties[key], {
          ...context,
          value: value[key]
        })
      }
    }, {})
  }
])

export const defaultsListResolver = (
  listTypes:string[] = ['list']
):ResolverCandidate => ([
  (schema) => (
    isPlainObject(schema) &&
    isPlainObject(schema.itemSchema) &&
    listTypes.includes(schema.type)
  ),
  (schema, context) => {
    const value = Array.isArray(context.value)
      ? context.value
      : schema.default !== undefined
        ? schema.default
        : []

    return value.map(item => applyDefaults(schema.itemSchema, {
      ...context,
      value: item
    }))
  }
])

export const defaultsDefaultResolver = (defaultsByType = {
  string: '',
  number: 0
}):ResolverCandidate => ([
  (schema) => (
    isPlainObject(schema) &&
    typeof schema.type === 'string'
  ),
  (schema) => schema.default !== undefined
    ? schema.default
    : defaultsByType[schema.type]
])

export const applyDefaults = (
  schema:ResolvedSchema,
  context:Context
):any => {
  return nestedMap(schema, {
    resolvers: [
      defaultsMapResolver(),
      defaultsListResolver(),
      defaultsDefaultResolver()
    ],
    ...context,
  })
}
