import { Expression } from '@orioro/expression'
import { ValidationErrorSpec } from '@orioro/validate'
import { Node } from '@orioro/tree-collect-nodes'

export type UnresolvedSchema =
  | Expression
  | {
      type: string | Expression
      enum?: any[] | Expression
      errors?: { [key: string]: ValidationErrorSpec } | Expression
      [key: string]: any
    }

export type ResolvedSchema = {
  type: string
  enum?: any[]
  errors?: { [key: string]: ValidationErrorSpec }
  [key: string]: any
}

export { ValidationErrorSpec }

export type ValidationSpec = Node & {
  validationExpression: Expression
}

export type BuiltInType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
