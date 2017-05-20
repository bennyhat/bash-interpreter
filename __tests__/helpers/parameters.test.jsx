import {assignParameters, expandParameters} from '../../src/helpers/parameters';

jest.mock('../../src/interpret-script.jsx');
import {interpretScript} from '../../src/interpret-script.jsx';

describe('variables', () => {
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

  describe('#expandParameters() given text with replaceable tokens, a parameter expansion list and a from scope', () => {
    const replaceableText = '${c}something$d';
    const expansionList = [
      {
        "loc": {
          "start": 0,
          "end": 3
        },
        "parameter": "c",
        "type": "ParameterExpansion"
      },
      {
        "loc": {
          "start": 13,
          "end": 14
        },
        "parameter": "d",
        "type": "ParameterExpansion"
      }
    ];
    const fromScopeList = [{
      'c': 'g',
      'd': 'h'
    }];
    let replacedText = '';

    beforeEach(() => {
      replacedText = expandParameters(replaceableText, expansionList, fromScopeList);
    });

    it('adds the variable to the to scope', () => {
      expect(replacedText).toEqual('gsomethingh');
    });
  });
  describe('#expandParameters() given text with replaceable tokens, a command expansion list and a from scope', () => {
    const replaceableText = 'a$(fakeCommand something)b';
    const expansionList = [
      {
        "loc": {
          "start": 1,
          "end": 24
        },
        "command": "fakeCommand something",
        "type": "CommandExpansion",
        "commandAST": {
          "type": "Script",
          "commands": [
            {
              "type": "Command",
              "name": {
                "text": "fakeCommand",
                "type": "Word"
              },
              "suffix": [
                {
                  "text": "something",
                  "type": "Word"
                }
              ]
            }
          ]
        }
      }
    ];
    const fromScopeList = [{
      'c': 'g',
    }];
    let replacedText = '';

    beforeEach(() => {
      interpretScript.mockClear();
      interpretScript.mockReturnValue({interpreterOutput: 'something'});
      replacedText = expandParameters(replaceableText, expansionList, fromScopeList);
    });

    it('adds the variable to the to scope', () => {
      expect(replacedText).toEqual('asomethingb');
    });
  });
});