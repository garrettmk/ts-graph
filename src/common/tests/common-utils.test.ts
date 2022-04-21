import { ensureArray, matchesEntityQuery, omit, pick } from "..";


describe('testing omit()', () => {
  const obj = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  }

  it('should return an object equal to the input minus the given keys', () => {
    const keys = ['one', 'two', 'three'] as const;
    const expected = { four: 4, five: 5, six: 6 };

    const result = omit(obj, keys);

    expect(result).toMatchObject(expected);
  });

  it('should return an equal object if the keys array is empty', () => {
    const keys = [] as const;
    const expected = obj;

    const result = omit(obj, keys);

    expect(result).toMatchObject(expected);
  });

  it('should do nothing with keys that do not exist in the input', () => {
    const keys = ['foo', 'bar'] as const;
    const expected = obj;

    // @ts-expect-error
    const result = omit(obj, keys);

    expect(result).toMatchObject(expected);
  })
});


describe('testing pick()', () => {
  const obj = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  }

  it('should return an object with the chosen fields from the input', () => {
    const keys = ['one', 'two', 'three'] as const;
    const expected = { one: 1, two: 2, three: 3 };

    const result = pick(obj, keys);

    expect(result).toMatchObject(expected);
  });

  it('should return an empty object if the keys array is empty', () => {
    const keys = [] as const;
    const expected = {};

    const result = pick(obj, keys);

    expect(result).toMatchObject(expected);
  });

  it('should do nothing with keys that do not exist in the input', () => {
    const keys = ['foo', 'bar'] as const;
    const expected = {};

    // @ts-expect-error
    const result = pick(obj, keys);

    expect(result).toMatchObject(expected);
  });
});


describe('testing matchesEntityQuery()', () => {
  const obj = {
    id: '1',
    name: 'Fido',
    type: 'dog',
    age: 5,
    tricks: ['shake', 'roll'],
    housetrained: true
  };

  it.each([
    { type: 'dog', age: 5 },
    { type: ['dog', 'cat'], age: { lt: 10 } },
    { age: 5, name: { re: /fido/i } },
    { housetrained: true, tricks: { length: { gt: 0 } } },
  ])('should return true for query %s', query => {
    expect(matchesEntityQuery(obj, query)).toBe(true);
  });

  it.each([
    { type: 'dog', age: 4 },
    { type: 'fish', name: 'roger' },
  ])('should return false for the query %s', query => {
    expect(matchesEntityQuery(obj, query)).toBe(false);
  })
});


describe('testing ensureArray()', () => {
  it('should return an array with one item, if the input is not an array', () => {
    const input = 'hello';
    const expected = ['hello'];

    const result = ensureArray(input);

    expect(result).toMatchObject(expected);
  });

  it('should return the input unchanged if the input is an array', () => {
    const input = ['hello'];

    const result = ensureArray(input);

    expect(result).toBe(input);
  })
})