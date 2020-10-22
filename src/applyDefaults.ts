import { isPlainObject, get } from 'lodash'
import {
  nestedResolve,
  RESOLVER_OBJECT,
  RESOLVER_ARRAY
} from '@orioro/nested-resolve'

export const defaultsMapResolver = (mapTypes:string[] = ['map']) => ([
  (subSchema) => (
    isPlainObject(subSchema) &&
    isPlainObject(subSchema.properties) &&
    mapTypes.includes(subSchema.type)
  ),
  (subSchema, options) => {
    const value = isPlainObject(options.value) ? options.value : {}

    return Object.keys(subSchema.properties).reduce((acc, key) => {
      return {
        ...acc,
        [key]: applyDefaults(options, subSchema.properties[key], value[key])
      }
    }, {})
  }
])

export const defaultsListResolver = (listTypes:string[] = ['list']) => ([
  (subSchema) => (
    isPlainObject(subSchema) &&
    isPlainObject(subSchema.item) &&
    listTypes.includes(subSchema.type)
  ),
  (subSchema, options) => {
    const value = Array.isArray(options.value)
      ? options.value
      : subSchema.default !== undefined
        ? subSchema.default
        : []

    return value.map(item => applyDefaults(options, subSchema.item, item))
  }
])

export const defaultsDefaultResolver = (defaultsByType = {
  string: '',
  number: 0
}) => ([
  (subSchema) => (
    isPlainObject(subSchema) &&
    typeof subSchema.type === 'string'
  ),
  (subSchema) => subSchema.default !== undefined
    ? subSchema.default
    : defaultsByType[subSchema.type]
])

export const applyDefaults = (options, schema, value) => {
  return nestedResolve({
    resolvers: [
      defaultsMapResolver(),
      defaultsListResolver(),
      defaultsDefaultResolver()
    ],
    value
  }, schema)
}
