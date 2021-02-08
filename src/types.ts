import { ExpressionInterpreter, Expression } from '@orioro/expression'
import { ValidationErrorSpec } from '@orioro/validate'

export type Context = {
  value: any,
  interpreters?: { [key:string]: ExpressionInterpreter },
  path?: string,
  [key:string]: any
}

export type UnresolvedSchema = {
  type: string | Expression,
  enum?: any[] | Expression,
  errors?: { [key:string]: ValidationErrorSpec } | Expression,
  [key:string]: any
}

export type ResolvedSchema = {
  type: string,
  enum?: any[],
  errors?: { [key:string]: ValidationErrorSpec },
  [key:string]: any
}

export type MapSchema = ResolvedSchema & {
  properties: { [key:string]: ResolvedSchema }
}

export type ListSchema = ResolvedSchema & {
  itemSchema: ResolvedSchema,
  minLength?: number,
  maxLength?: number
}

export type StringSchema = ResolvedSchema & {
  minLength?: number,
  maxLength?: number
}

export type NumberSchema = ResolvedSchema & {
  min?: number,
  minExclusive?: number,
  max?: number,
  maxExclusive?: number
}
