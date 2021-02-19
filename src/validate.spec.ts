import { validate } from './validate'

import { get } from 'lodash'

const dump = value => console.log(JSON.stringify(value, null, '  '))

const REQUIRED_ERROR = {
  code: 'REQUIRED_ERROR',
  message: 'This value is required'
}

const TYPE_ERROR = {
  code: 'TYPE_ERROR',
  message: 'Invalid type'
}

const MIN_LENGTH_ERROR = {
  code: 'MIN_LENGTH_ERROR'
}

const MAX_LENGTH_ERROR = {
  code: 'MAX_LENGTH_ERROR'
}

const PATTERN_ERROR = {
  code: 'PATTERN_ERROR'
}

describe('type: string', () => {
  test('basic', () => {
    const schema = {
      type: 'string',
      required: true,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR
      }
    }

    const expectations = [
      [null, [REQUIRED_ERROR]],
      [undefined, [REQUIRED_ERROR]],
      [9, [TYPE_ERROR]],
      ['some string', null],
    ]

    expectations.forEach(([input, result]) => {
      if (typeof result === 'object' && result !== null) {
        expect(validate(schema, input)).toMatchObject(result)
      } else {
        expect(validate(schema, input)).toEqual(result)
      }
    })
  })

  test('with string special validations', () => {

    const schema = {
      type: 'string',
      required: true,
      minLength: 8,
      maxLength: 16,
      // Minimum eight characters, at least one letter and one number:
      pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$',
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR,
        minLength: MIN_LENGTH_ERROR,
        maxLength: MAX_LENGTH_ERROR,
        pattern: PATTERN_ERROR
      }
    }

    const expectations = [
      [null, [REQUIRED_ERROR]],
      [9, [TYPE_ERROR]],
      ['1', [MIN_LENGTH_ERROR, PATTERN_ERROR]],
      ['12345678901234567890', [MAX_LENGTH_ERROR, PATTERN_ERROR]],
      ['1234567890', [PATTERN_ERROR]],
      ['A1234567890a', null],
    ]

    expectations.forEach(([input, result]) => {
      if (typeof result === 'object' && result !== null) {
        expect(validate(schema, input)).toMatchObject(result)
      } else {
        expect(validate(schema, input)).toEqual(result)
      }
    })
  })
})

describe('type: map - 1', () => {
  const errors = {
    required: REQUIRED_ERROR,
    type: TYPE_ERROR
  }

  const schema = {
    type: 'map',
    properties: {
      givenName: {
        type: 'string',
        required: true,
        errors
      },
      familyName: {
        type: 'string',
        errors
      },
      role: {
        type: 'string',
        required: true,
        enum: ['passenger', 'driver'],
        errors
      },
      age: {
        type: 'number',
        required: true,
        errors
      }
    },
    validation: [
      [
        [
          '$if',
          ['$eq', 'driver', ['$value', 'role']],
          ['$gte', 18, ['$value', 'age']],
          true
        ],
        'DRIVER_MIN_AGE_18'
      ]
    ]
  }

  test('no error', () => {
    expect(validate(schema, {
      givenName: 'João',
      familyName: 'Moreira',
      role: 'driver',
      age: 20
    })).toEqual(null)
  })

  test('REQUIRED_ERROR', () => {
    expect(validate(schema, {})).toEqual([
      {
        ...REQUIRED_ERROR,
        path: 'givenName',
        value: undefined
      },
      {
        ...REQUIRED_ERROR,
        path: 'role',
        value: undefined
      },
      {
        ...REQUIRED_ERROR,
        path: 'age',
        value: undefined
      }
    ])
  })

  test('conditional error w/ required error (errors in multiple levels)', () => {
    const value = {
      familyName: 'Moreira',
      role: 'driver',
      age: 15
    }

    expect(validate(schema, value)).toEqual([
      {
        code: 'DRIVER_MIN_AGE_18',
        path: '',
        value
      },
      {
        ...REQUIRED_ERROR,
        path: 'givenName',
        value: undefined
      }
    ])
  })
})

describe('type: list - 1', () => {
  const schema = {
    type: 'list',
    itemSchema: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 10,
      errors: {
        required: REQUIRED_ERROR,
        type: TYPE_ERROR,
        minLength: MIN_LENGTH_ERROR,
        maxLength: MAX_LENGTH_ERROR
      }
    }
  }

  test('', () => {
    const value = [
      '123',
      '12345678',
      undefined,
      null,
      '12345678901234567890',
    ]

    const result = validate(schema, value, {
      getType: value => {
        return Array.isArray(value)
          ? 'list'
          : undefined
      }
    })

    expect(result).toEqual([
      {
        ...MIN_LENGTH_ERROR,
        path: '0',
        value: '123'
      },
      {
        ...REQUIRED_ERROR,
        path: '2',
        value: undefined
      },
      {
        ...REQUIRED_ERROR,
        path: '3',
        value: null
      },
      {
        ...MAX_LENGTH_ERROR,
        path: '4',
        value: '12345678901234567890'
      }
    ])
  })
})
