import {
  InterpreterSpec,
  typeExpressions,
  TypeMap,
  TypeAlternatives,
  CORE_TYPES,
} from '@orioro/expression'
import { pick } from 'lodash'

import { DateTime } from 'luxon'

export const CORE_SCHEMA_TYPES: TypeMap = {
  ISODate: (value) =>
    typeof value === 'string' && DateTime.fromISO(value).isValid,
  ...pick(CORE_TYPES, [
    'string',
    'number',
    'object',
    'array',
    'boolean',
    'undefined',
    'null',
  ]),
}

/**
 * @todo expressions Write specific tests for $schemaType and $isSchemaType expressions
 * @function schemaTypeExpression
 */
export const schemaTypeExpressions = (
  types: TypeMap | TypeAlternatives = CORE_SCHEMA_TYPES
): {
  $schemaType: InterpreterSpec
  $isSchemaType: InterpreterSpec
} => {
  const [$schemaType, $isSchemaType] = typeExpressions(types)

  return {
    $schemaType,
    $isSchemaType,
  }
}
