import {
  validate as _validate,
  VALIDATORS,
} from '@orioro/validate'
import { filterMatching } from '@orioro/cascade'
import {
  mergeTypeLists,
  mergeArrays,
  schemaIsType
} from './util'

const PARSER_TYPE_MAP = {
  criteria: (schema, { MAP_TYPES }) => {
    return schemaIsType(schema, MAP_TYPES) && schema.attributes
  },
  value: (schema, options, validation) => {
    validation = {
      ...validation,
      objectPlain: {
        message: `${schema.label || 'Value'} must be a plain object`,
      }
    }

    return options.recursive ? {
      ...validation,
      objectProperties: {
        properties: Object.keys(schema.attributes).reduce((acc, attributeId) => {
          return {
            ...acc,
            [attributeId]: _schemaParseValidation(options, schema.attributes[attributeId])
          }
        }, {})
      }
    } : validation
  }
}

const PARSER_TYPE_LIST = {
  criteria: (schema, { LIST_TYPES }) => {
    return schemaIsType(schema, LIST_TYPES) && schema.item
  },
  value: (schema, options, validation) => {
    validation = {
      ...validation,
      array: {
        message: `${schema.label || 'Value'} must be an array`,
      }
    }

    return options.recursive ? {
      ...validation,
      arrayItems: {
        validation: _schemaParseValidation(options, schema.item)
      }
    } : validation
  }
}

const PARSER_TYPE_STRING = {
  criteria: (schema, { STRING_TYPES }, validation) => {
    return schemaIsType(schema, STRING_TYPES)
  },
  value: (schema, options, validation) => {
    return validation.string ? validation : {
      ...validation,
      string: {
        message: `${schema.label || 'Value'} must be a string`,
      }
    }
  }
}

const PARSER_TYPE_NUMBER = {
  criteria: (schema, { NUMBER_TYPES = [] }, validation) => {
    return schemaIsType(schema, NUMBER_TYPES)
  },
  value: (schema, options, validation) => {
    return validation.number ? validation : {
      ...validation,
      number: {
        message: `${schema.label || 'Value'} must be a number`,
      }
    }
  }
}

const PARSER_TYPE_BOOLEAN = {
  criteria: (schema, { BOOLEAN_TYPES = [] }, validation) => {
    return schemaIsType(schema, BOOLEAN_TYPES)
  },
  value: (schema, options, validation) => {
    return validation.boolean ? validation : {
      ...validation,
      boolean: {
        message: `${schema.label || 'Value'} must be a boolean`,
      }
    }
  }
}

const PARSER_TYPE_DATE = {
  criteria: (schema, { DATE_TYPES = [] }, validation) => {
    return schemaIsType(schema, DATE_TYPES)
  },
  value: (schema, options, validation) => {
    return validation.date ? validation : {
      ...validation,
      date: {
        message: `${schema.label || 'Value'} must be a valid date`,
      }
    }
  }
}

const PARSER_REQUIRED = {
  criteria: (schema, options) => {
    return schema.required === true || typeof schema.required === 'object'
  },
  value: (schema, options, validation) => {
    const requiredValidation = typeof schema.required === 'object' ?
      schema.required :
      { message: `${schema.label || 'Value'} is required` }

    return {
      ...validation,
      notNull: requiredValidation,
      notUndefined: requiredValidation,
    }
  }
}

const PARSER_DEFAULT = {
  criteria: true,
  value: (schema, options, validation) => {
    return schema.validation ? {
      ...validation,
      ...schema.validation,
    } : validation
  }
}

const CORE_VALIDATION_PARSERS = [
  PARSER_TYPE_MAP,
  PARSER_TYPE_LIST,
  PARSER_TYPE_STRING,
  PARSER_TYPE_NUMBER,
  PARSER_TYPE_BOOLEAN,
  PARSER_TYPE_DATE,

  PARSER_REQUIRED,
  PARSER_DEFAULT,
]

const _schemaParseValidation = (options, schema) => {
  const parsersToApply = filterMatching(options.validationParsers, schema, options)

  return parsersToApply.reduce((acc, parser) => {
    return parser(schema, options, acc)
  }, Object.assign({}, schema.validation))
}

export const schemaParseValidation = ({ validationParsers, ...options } = {}, schema) => {
  const typeLists = mergeTypeLists(options)

  if (!schemaIsType(schema, typeLists.ALL_TYPES)) {
    throw new Error(`Invalid schema.type \`${schema.type}\``)
  }

  return _schemaParseValidation({
    ...options,
    ...typeLists,
    validationParsers: mergeArrays(validationParsers, CORE_VALIDATION_PARSERS),
  }, schema)
}
