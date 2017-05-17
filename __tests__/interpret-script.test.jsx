import {interpretScript, configuration} from "../src/interpret-script";

describe('interpretScript', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    configuration.commandToFunctionMap = {
      'fakeCommand': fakeCommand
    }
  });

  describe('given a fake command AST in the parser output field part of the state ', () => {
    let incomingState = {
      parserOutput: {
        type: "Script",
        commands: [
          {
            type: "Command",
            name: {
              text: "fakeCommand",
              type: "Word"
            },
            suffix: [
              {
                text: "a literal string",
                type: "Word"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });
    it('calls the fake command with the parts in the suffix', () => {
      expect(fakeCommand).toBeCalledWith({}, 'a literal string');
    });
  });

  describe('given a literal variable assignment command AST in the parser output field part of the state', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
              {
                "text": "a=b",
                "type": "AssignmentWord"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });
    it('assigns a variable into to the interpreter state', () => {
      expect(newState.interpreterState.shellScope).toEqual({
        'a': 'b',
        'c': 'd'
      });
    });
    it('marks the interpreter output as non-printable', () => {
      expect(newState.interpreterOutputPrintable).toEqual(false);
    });
  });
  describe('given a variable assignment prefix (literal) for a variable fake command', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "name": {
              "text": "fakeCommand",
              "type": "Word"
            },
            "prefix": [
              {
                "text": "a=b",
                "type": "AssignmentWord"
              }
            ],
            "suffix": [
              {
                "text": "something",
                "type": "Word"
              },
              {
                "text": "$a",
                "expansion": [
                  {
                    "loc": {
                      "start": 0,
                      "end": 1
                    },
                    "parameter": "a",
                    "type": "ParameterExpansion"
                  }
                ],
                "type": "Word"
              },
              {
                "text": "$c",
                "expansion": [
                  {
                    "loc": {
                      "start": 0,
                      "end": 1
                    },
                    "parameter": "c",
                    "type": "ParameterExpansion"
                  }
                ],
                "type": "Word"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });

    it('calls the fake command with command scope as environment and what was in shell scope', () => {
      expect(fakeCommand).toBeCalledWith({'a': 'b'}, 'something', 'd');
    });
  });
  describe('given a variable expansion and concatenation in the fake command command', () => {
    let incomingState = {
      parserOutput: {
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
                "text": "${c}something$d",
                "expansion": [
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
                ],
                "type": "Word"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd',
          'd': 'e'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });
    it('calls the fake command with the concatenation', () => {
      expect(fakeCommand).toBeCalledWith({}, 'dsomethinge');
    });
  });
  describe('given a variable expansion and concatenation in an assignment', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
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
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd',
          'd': 'e'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });

    it('sets the variable to the concatenation results', () => {
      expect(newState.interpreterState.shellScope.a).toEqual('dsomethinge');
    });
  });
  describe('given a variable expansion in multiple assignments', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
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
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'c': 'd',
          'd': 'e'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });

    it('sets the first variable to the literal', () => {
      expect(newState.interpreterState.shellScope.a).toEqual('something');
    });
    it('sets the second variable to the value of the first', () => {
      expect(newState.interpreterState.shellScope.b).toEqual('something');
    });
  });
});