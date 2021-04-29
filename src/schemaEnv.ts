import {
  resolveSchema as resolveSchema_,
  schemaResolverObject,
  schemaResolverArray,
  schemaResolverExpression,
  schemaResolverDefault,
} from './resolveSchema'

import {
  resolveValue as resolveValue_,
  objectValueResolver,
  arrayValueResolver,
  defaultValueResolver,
} from './resolveValue'

import {
  validateSync as validateSync_,
  validateSyncThrow as validateSyncThrow_,
} from './validate'
import { schemaTypeExpressions } from './expressions'
import {
  validationCollectorObject,
  validationCollectorArray,
  validationCollectorString,
  validationCollectorNumber,
  validationCollectorBoolean,
  validationCollectorDefault,
} from './collectValidations'

import { interpreterList, ALL_EXPRESSIONS } from '@orioro/expression'

import { DATE_EXPRESSIONS } from '@orioro/expression-date'
import { STRING_IS_EXPRESSIONS } from '@orioro/expression-string-is'

import {
  ResolvedSchema,
  UnresolvedSchema,
  ValidationErrorSpec,
  SchemaEnvOptions,
} from './types'

export const DEFAULT_EXPRESSION_INTERPRETERS = {
  ...ALL_EXPRESSIONS,
  ...DATE_EXPRESSIONS,
  ...STRING_IS_EXPRESSIONS,
}

/**
 * @function schemaEnv
 */
export const schemaEnv = ({
  types,
  interpreters = DEFAULT_EXPRESSION_INTERPRETERS,
  schemaResolvers,
  valueResolvers,
  validationCollectors,
}: SchemaEnvOptions = {}): {
  resolveSchema: (schema: UnresolvedSchema, value: any) => ResolvedSchema
  resolveValue: (schema: ResolvedSchema, value: any) => any
  validateSync: (
    schema: ResolvedSchema,
    value: any
  ) => null | ValidationErrorSpec[]
  validateSyncThrow: (schema: ResolvedSchema, value: any) => void
} => {
  interpreters = interpreterList({
    ...interpreters,
    ...schemaTypeExpressions(types),
  })

  const resolveSchema = resolveSchema_.bind(null, {
    resolvers: Array.isArray(schemaResolvers)
      ? schemaResolvers
      : [
          schemaResolverExpression({ interpreters }),
          schemaResolverObject(),
          schemaResolverArray(),
          schemaResolverDefault(),
        ],
  })

  const resolveValue = resolveValue_.bind(null, {
    resolvers: Array.isArray(valueResolvers)
      ? valueResolvers
      : [objectValueResolver(), arrayValueResolver(), defaultValueResolver()],
  })

  const validateContext = {
    interpreters,
    collectors: Array.isArray(validationCollectors)
      ? validationCollectors
      : [
          validationCollectorObject(),
          validationCollectorArray(),
          validationCollectorString(),
          validationCollectorNumber(),
          validationCollectorBoolean(),
          validationCollectorDefault(),
        ],
    resolveSchema,
  }

  const validateSync = validateSync_.bind(null, validateContext)
  const validateSyncThrow = validateSyncThrow_.bind(null, validateContext)

  return {
    resolveSchema,
    resolveValue,
    validateSync,
    validateSyncThrow,
  }
}
