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
  validate as validate_,
  validateThrow as validateThrow_,
} from './validate'
import { schemaTypeExpression, GetTypeInterface } from './expressions'
import {
  validationCollectorObject,
  validationCollectorArray,
  validationCollectorString,
  validationCollectorNumber,
  validationCollectorBoolean,
  validationCollectorDefault,
} from './collectValidations'

import { ALL_EXPRESSIONS, ExpressionInterpreterList } from '@orioro/expression'

import {
  ResolvedSchema,
  UnresolvedSchema,
  ValidationErrorSpec,
  ResolverCandidate,
  NodeCollector,
} from './types'

type SchemaEnvOptions = {
  getType?: GetTypeInterface
  interpreters?: ExpressionInterpreterList
  schemaResolvers?: ResolverCandidate[]
  valueResolvers?: ResolverCandidate[]
  validationCollectors?: NodeCollector[]
}

/**
 * @function schemaEnv
 */
export const schemaEnv = ({
  getType,
  interpreters = ALL_EXPRESSIONS,
  schemaResolvers,
  valueResolvers,
  validationCollectors,
}: SchemaEnvOptions = {}): {
  resolveSchema: (schema: UnresolvedSchema, value: any) => ResolvedSchema
  resolveValue: (schema: ResolvedSchema, value: any) => any
  validate: (schema: ResolvedSchema, value: any) => null | ValidationErrorSpec[]
  validateThrow: (schema: ResolvedSchema, value: any) => void
} => {
  interpreters = {
    ...interpreters,
    $schemaType: schemaTypeExpression(getType),
  }

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

  const validate = validate_.bind(null, validateContext)
  const validateThrow = validateThrow_.bind(null, validateContext)

  return {
    resolveSchema,
    resolveValue,
    validate,
    validateThrow,
  }
}
