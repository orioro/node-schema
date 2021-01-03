import { isPlainObject, get } from 'lodash'
import { cascadeFilter, test } from '@orioro/cascade'
import { treeSourceNodes } from '@orioro/tree-source-nodes'

export const mapValidationResolver = (mapTypes = ['map']) => ([
  (subSchema) => (
    isPlainObject(subSchema) &&
    isPlainObject(subSchema.properties) &&
    mapTypes.includes(subSchema.type)
  ),
  (subSchema, context) => {
    return Object.keys(subSchema.properties).reduce((acc, key) => {
      return [
        ...acc,
        ...parseValidations(subSchema.properties[key], {
          ...context,
          path: `${context.path}.${key}`
        })
      ]
    }, [])
  }
])


const allowNull = (type, validations) => ([
  '$if',
  validations,
  [],
  ['$notEq', null]
])


const required = (type, errorMessage, validations) => ([
  [
    ['$eq', 'string', ['$type']],
    errorMessage
  ],
  ...validations
])

export const stringValidationResolver = ({ types, requiredErrorMessage } = {
  types: ['string'],
  requiredErrorMessage: (schema) => {
    return typeof schema.required === 'string'
      ? schema.required
      : `${schema.label} is a required string`
  }
}) => ([
  (subSchema) => types.includes(subSchema.type),
  (subSchema, context) => {

    return subSchema.required
      ? required('string', requiredErrorMessage(subSchema), subSchema.validations)
      : allowNull()


    return subSchema.required
      ? [
          ,
          ...subSchema.validations
        ]
      : [

        ]

    if (subSchema.required) {


    }

  }
])

export const defaultValidationResolver = () => ([
  (subSchema, context) => {
    return (subSchema.validations ? subSchema.validations : []).map(validation => ({
      path: context.path,
      validation
    }))
  }
])

export const parseValidations = (schema, options) => treeSourceNodes(schema, options)
