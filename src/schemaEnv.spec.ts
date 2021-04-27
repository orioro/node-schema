import { schemaEnv } from './schemaEnv'

describe('schemaEnv - basic', () => {
  const { resolveSchema, resolveValue, validateSync } = schemaEnv()

  const stringSchema = {
    type: 'string',
    default: '1234567890',
    minLength: 5,
    maxLength: 10,
  }

  const arraySchema = {
    type: 'array',
    items: stringSchema,
    default: ['1', '2', '3'],
  }

  const schema = [
    '$switchKey',
    {
      string: stringSchema,
      array: arraySchema,
    },
    stringSchema,
    ['$schemaType'],
  ]

  test('resolveSchema(unresolvedSchema, unresolvedValue)', () => {
    expect(resolveSchema(schema, 'some string')).toEqual(stringSchema)
    expect(resolveSchema(schema, [])).toEqual(arraySchema)
  })

  test('resolveValue(resolvedSchema, unresolvedValue)', () => {
    expect(resolveValue(resolveSchema(schema, undefined), undefined)).toEqual(
      '1234567890'
    )

    expect(resolveValue(resolveSchema(schema, 9), 9)).toEqual(9)

    expect(resolveValue(resolveSchema(schema, []), [])).toEqual([])

    expect(
      resolveValue(resolveSchema(schema, ['123', '12345', '1234567890', 8]), [
        '123',
        '12345',
        '1234567890',
        8,
      ])
    ).toEqual(['123', '12345', '1234567890', 8])
  })

  test('validateSync(resolvedSchema, resolvedValue)', () => {
    const v1 = undefined
    const rs1 = resolveSchema(schema, v1) // resolvedSchema
    const rv1 = resolveValue(rs1, v1) // resolvedValue
    expect(validateSync(rs1, rv1)).toEqual(null)

    const v2 = '123'
    const rs2 = resolveSchema(schema, v2)
    const rv2 = resolveValue(rs2, v2)
    expect(validateSync(rs2, rv2)).toMatchObject([
      { code: 'STRING_MIN_LENGTH_ERROR', path: '' },
    ])

    const v3 = ['123', '12345', '12345678901', 8]
    const rs3 = resolveSchema(schema, v3)
    const rv3 = resolveValue(rs3, v3)
    expect(validateSync(rs3, rv3)).toMatchObject([
      { code: 'STRING_MIN_LENGTH_ERROR', path: '0' },
      { code: 'STRING_MAX_LENGTH_ERROR', path: '2' },
      { code: 'TYPE_ERROR', path: '3' },
    ])
  })
})
