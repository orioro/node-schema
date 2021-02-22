import { ExpressionInterpreter, interpreter } from '@orioro/expression'

import { getType as _getType } from '@orioro/validate-type'

export type GetTypeInterface = (value: any) => string | void

/**
 * @todo expressions better integrate $schemaType expression with built-in $type
 */
export const schemaTypeExpression = (
  getType: GetTypeInterface = _getType
): ExpressionInterpreter => interpreter((value: any) => getType(value), ['any'])
