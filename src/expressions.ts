import { ExpressionInterpreter, interpreter } from '@orioro/expression'

import { getType as _getType } from '@orioro/validate-type'

const defaultGetType = (value) => undefined // eslint-disable-line @typescript-eslint/no-unused-vars

export type GetTypeInterface = (value: any) => string | void

export const schemaTypeExpression = (
  getType: GetTypeInterface = _getType
): ExpressionInterpreter => interpreter((value: any) => getType(value), ['any'])
