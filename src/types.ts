import { Expression } from '@orioro/expression'
import { ValidationErrorSpec } from '@orioro/validate'
import { Node } from '@orioro/tree-collect-nodes'

export type UnresolvedSchema = {
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

export type MapSchema = ResolvedSchema & {
  properties: { [key: string]: ResolvedSchema }
}

export type ListSchema = ResolvedSchema & {
  items: ResolvedSchema
  minLength?: number
  maxLength?: number
}

export type StringSchema = ResolvedSchema & {
  minLength?: number
  maxLength?: number
}

export type NumberSchema = ResolvedSchema & {
  min?: number
  minExclusive?: number
  max?: number
  maxExclusive?: number
}

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
