import {assignParameters, expandParameter} from '../../src/helpers/parameters';

describe('parameters', () => {
  describe('#assignParameters() given list of simple assignments and from and to scopes', () => {
    let assignmentList = [
      {
        "text": "a=b",
        "type": "AssignmentWord"
      },
      {
        "text": "c=d",
        "type": "AssignmentWord"
      }
    ];
    let fromScope = {
      'c': 'z'
    };
    let toScope = {
      'e': 'f'
    };

    beforeEach(() => {
      assignParameters(assignmentList, fromScope, toScope);
    });

    it('adds the variable to the to scope', () => {
      expect(toScope).toEqual({
        'a': 'b',
        'c': 'd',
        'e': 'f'
      });
    });
  });
  describe('#assignParameters() given list of parameter expansion assignments and from and to scopes', () => {
    let assignmentList = [
      {
        "text": "a=${c}something$d",
        "expansion": [
          {
            "loc": {
              "start": 2,
              "end": 5
            },
            "parameter": "c",
            "type": "ParameterExpansion"
          },
          {
            "loc": {
              "start": 15,
              "end": 16
            },
            "parameter": "d",
            "type": "ParameterExpansion"
          }
        ],
        "type": "AssignmentWord"
      }
    ];
    let fromScope = {
      'c': 'z',
      'd': 'x'
    };
    let toScope = {
      'e': 'f'
    };

    beforeEach(() => {
      assignParameters(assignmentList, fromScope, toScope);
    });

    it('adds the variable to the to scope', () => {
      expect(toScope).toEqual({
        'a': 'zsomethingx',
        'e': 'f'
      });
    });
  });
  describe('#assignParameters() given list of multiple mixed assignments and from and to scopes', () => {
    let assignmentList = [
      {
        "text": "a=something",
        "type": "AssignmentWord"
      },
      {
        "text": "b=$a",
        "expansion": [
          {
            "loc": {
              "start": 2,
              "end": 3
            },
            "parameter": "a",
            "type": "ParameterExpansion"
          }
        ],
        "type": "AssignmentWord"
      }
    ];
    let fromScope = {
      'c': 'z'
    };
    let toScope = {
      'e': 'f'
    };

    beforeEach(() => {
      assignParameters(assignmentList, fromScope, toScope);
    });

    it('adds the variable to the to scope', () => {
      expect(toScope).toEqual({
        'a': 'something',
        'b': 'something',
        'e': 'f'
      });
    });
  });

  describe('#expandParameter() given a scope list and a parameter name', () => {

    const scopeList = [
      {
        'c': 'g',
        'd': 'h'
      },
      {
        'c': 'd'
      }
    ];
    const parameterName = 'c';

    let expandedParameter = '';

    beforeEach(() => {
      expandedParameter = expandParameter(scopeList, parameterName);
    });

    it('returns the first parameter value it finds', () => {
      expect(expandedParameter).toEqual('g');
    });
  });
});