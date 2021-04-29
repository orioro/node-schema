import { Alternative } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { getError } from '../util'

import { ResolvedSchema } from '../types'

/**
 * @const ENUM
 */
export const ENUM: Alternative = [
  (schema: ResolvedSchema): boolean => Array.isArray(schema.enum),
  (schema: ResolvedSchema): ValidationCase => {
    const enum_ = schema.enum as any[]

    return [
      ['$in', schema.enum],
      getError(schema, 'enum', {
        code: 'ENUM_ERROR',
        message: `Must be one of ${enum_.join(', ')}`,
      }),
    ]
  },
]
