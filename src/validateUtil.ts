import { InterpreterList } from '@orioro/expression'
import { ParseValidationsContext } from './collectValidations'

export type ValidateContext = ParseValidationsContext & {
  interpreters: InterpreterList
}

export type ValidateOptions =
  | string[]
  | {
      paths?: string[]
      ignore?: string[]
    }

export type ValidateAsyncOptions = ValidateOptions & {
  mode: 'serial' | 'parallel'
}
