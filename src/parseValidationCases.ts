import { Alternative, cascadeFilter, test } from '@orioro/cascade'
import { ValidationCase } from '@orioro/validate'
import { ResolvedSchema } from './types'

/**
 * @function parseValidationCases
 */
export const parseValidationCases = (
  schema: ResolvedSchema,
  caseAlternatives: Alternative[]
): ValidationCase[] => {
  const parsedCases = cascadeFilter(
    test,
    caseAlternatives,
    schema
  ).map((prepareCase) => prepareCase(schema))

  const schemaCases = Array.isArray(schema.validation) ? schema.validation : []

  return [...parsedCases, ...schemaCases]
}

export * from './parseValidationCases/enum'
export * from './parseValidationCases/string'
export * from './parseValidationCases/number'
export * from './parseValidationCases/array'
export * from './parseValidationCases/object'
export * from './parseValidationCases/ISODate'
export * from './parseValidationCases/boolean'
