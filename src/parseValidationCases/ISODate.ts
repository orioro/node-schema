import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

import { CORE_SCHEMA_TYPES } from '../expressions'

import { ENUM } from './enum'

export const ISO_DATE_MIN: Alternative = [
  (schema: ResolvedSchema): boolean =>
    CORE_SCHEMA_TYPES.ISODate(schema.min) ||
    CORE_SCHEMA_TYPES.ISODate(schema.minExclusive),
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.minExclusive === 'string'
      ? ['$dateGt', schema.minExclusive]
      : ['$dateGte', schema.min],
    getError(schema, 'min', {
      code: 'ISO_DATE_MIN_ERROR',
    }),
  ],
]

export const ISO_DATE_MAX: Alternative = [
  (schema: ResolvedSchema): boolean =>
    CORE_SCHEMA_TYPES.ISODate(schema.max) ||
    CORE_SCHEMA_TYPES.ISODate(schema.maxExclusive),
  (schema: ResolvedSchema): ValidationCase => [
    typeof schema.maxExclusive === 'string'
      ? ['$dateLt', schema.maxExclusive]
      : ['$dateLte', schema.max],
    getError(schema, 'max', {
      code: 'ISO_DATE_MAX_ERROR',
    }),
  ],
]

export const DEFAULT_ISO_DATE_CASES = [ENUM, ISO_DATE_MIN, ISO_DATE_MAX]
