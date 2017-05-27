import {assignParameters, expandParameter} from '../../src/helpers/parameters';

describe('parameters', () => {
  describe('#assignParameters() given list of simple assignments, state, and type of command', () => {
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
    let state = {
      shellScope: {
        'c': 'z',
        'x': 'f'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state, 'command');
    });

    it('adds the variable to the command scope', () => {
      expect(state.commandScope).toEqual({
        'a': 'b',
        'c': 'd',
        'e': 'f'
      });
    });
  });
  describe('#assignParameters() given list of simple assignments, state, and type of exported', () => {
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
    let state = {
      shellScope: {
        'c': 'z',
        'x': 'f'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state, 'exported');
    });

    it('adds the variable to the exported scope', () => {
      expect(state.exportedScope).toEqual({
        'a': 'b',
        'c': 'd',
        'g': 'h'
      });
    });
  });
  describe('#assignParameters() given list of simple assignments, state, and type of shell', () => {
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
    let state = {
      shellScope: {
        'c': 'z',
        'x': 'f'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state, 'shell');
    });

    it('adds the variable to the shell scope', () => {
      expect(state.shellScope).toEqual({
        'a': 'b',
        'c': 'd',
        'x': 'f'
      });
    });
  });
  describe('#assignParameters() given list of simple assignments, state, and no type', () => {
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
    let state = {
      shellScope: {
        'c': 'z',
        'x': 'f'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state);
    });

    it('adds the variable to the shell scope', () => {
      expect(state.shellScope).toEqual({
        'a': 'b',
        'c': 'd',
        'x': 'f'
      });
    });
  });

  describe('#assignParameters() given list of parameter expansion assignments, state and no type', () => {
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
    let state = {
      shellScope: {
        'c': 'z',
        'd': 'x'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state);
    });

    it('adds the variable to the shell scope', () => {
      expect(state.shellScope).toEqual({
        'a': 'zsomethingx',
        'c': 'z',
        'd': 'x'
      });
    });
  });
  describe('#assignParameters() given list of multiple mixed assignments, a state and no type', () => {
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

    let state = {
      shellScope: {
        'c': 'z',
        'd': 'x'
      },
      commandScope: {
        'e': 'f'
      },
      exportedScope: {
        'g': 'h'
      }
    };

    beforeEach(() => {
      assignParameters(assignmentList, state);
    });

    it('adds the variable to the to scope', () => {
      expect(state.shellScope).toEqual({
        'a': 'something',
        'b': 'something',
        'c': 'z',
        'd': 'x'
      });
    });
  });

  describe('#expandParameter() given a parameter name and a state', () => {
    const parameterName = 'c';
    const state = {
      shellScope: {
        'c': 'd',
        'd': 'h'
      },
      exportedScope: {
        'c': 'e'
      }
    };

    let expandedParameter = '';

    beforeEach(() => {
      expandedParameter = expandParameter(parameterName, state);
    });

    it('returns the parameter out of the shell scope (exported and shell should never diverge)', () => {
      expect(expandedParameter).toEqual('d');
    });
  });
});