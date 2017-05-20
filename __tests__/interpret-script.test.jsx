import {interpretScript, configuration} from "../src/interpret-script";

describe('interpretScript', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockClear();
    configuration.functionMaps.command = {'fakeCommand': fakeCommand}
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
      expect(fakeCommand).toBeCalledWith({}, ['a literal string']);
    });
  });

  // TODO - moved
  describe('given a literal parameter assignment command AST in the parser output field part of the state', () => {
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
    it('assigns a parameter into to the interpreter state', () => {
      expect(newState.interpreterState.shellScope).toEqual({
        'a': 'b',
        'c': 'd'
      });
    });
    it('marks the interpreter output as non-printable', () => {
      expect(newState.interpreterOutputPrintable).toEqual(false);
    });
  });

  // TODO - moved
  describe('given a parameter assignment prefix (literal) for a parameter fake command', () => {
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
      expect(fakeCommand).toBeCalledWith({'a': 'b'}, ['something', 'd']);
    });
  });
  // TODO - moved
  describe('given a parameter expansion and concatenation in the fake command command', () => {
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
      fakeCommand.mockReturnValue('dsomethinge\n');
      newState = interpretScript(incomingState);
    });
    it('calls the fake command with the concatenation', () => {
      expect(fakeCommand).toBeCalledWith({}, ['dsomethinge']);
    });
    it('sets the interpreter output', () => {
      expect(newState.interpreterOutput).toEqual('dsomethinge\n');
    });
    it('sets the interpreter output to printable', () => {
      expect(newState.interpreterOutputPrintable).toEqual(true);
    });
  });
  // TODO - moved
  describe('given a parameter expansion and concatenation in an assignment', () => {
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

    it('sets the parameter to the concatenation results', () => {
      expect(newState.interpreterState.shellScope.a).toEqual('dsomethinge');
    });
  });
  // TODO - moved
  describe('given a parameter expansion in multiple assignments', () => {
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

    it('sets the first parameter to the literal', () => {
      expect(newState.interpreterState.shellScope).toEqual({
        'a': 'something',
        'b': 'something',
        'c': 'd',
        'd': 'e'
      });
    });
  });
  describe('given a parameter export assignment', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "name": {
              "text": "export",
              "type": "Word"
            },
            "suffix": [
              {
                "text": "a=b",
                "type": "Word"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });

    it('calls the fake command with the combination of the command and exported scopes', () => {
      expect(newState.interpreterState.exportedScope).toEqual({'a': 'b'});
    });
  });
  describe('given a parameter export and a fake command call', () => {
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
                "text": "d=e",
                "type": "AssignmentWord"
              }
            ],
            "suffix": [
              {
                "text": "something",
                "type": "Word"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {
          'a': 'b'
        }
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = interpretScript(incomingState);
    });

    it('calls the fake command with the combination of the command and exported scopes', () => {
      expect(fakeCommand).toBeCalledWith({'a': 'b', 'd': 'e'}, ['something']);
    });
  });
  // TODO - moved
  describe('given a parameter assignment from a sub-shell containing a fake command', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
              {
                "text": "a=$(echo something)",
                "expansion": [
                  {
                    "loc": {
                      "start": 2,
                      "end": 18
                    },
                    "command": "echo something",
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
        shellScope: {},
        commandScope: {},
        exportedScope: {
          'a': 'b'
        }
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue('something\n');
      newState = interpretScript(incomingState);
    });

    it('assigns the output of the sub-shell into that parameter in shell scope', () => {
      expect(newState.interpreterState.shellScope).toEqual({'a': 'something'});
    });

    it('does not bleed the sub-shell state into the main shell state', () => {
      expect(newState.parserOutput).toEqual(incomingState.parserOutput);
    });
  });

  describe('given consecutive commands, those commands can share state', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
              {
                "text": "a=asvalue",
                "type": "AssignmentWord"
              }
            ]
          },
          {
            "type": "Command",
            "name": {
              "text": "fakeCommand",
              "type": "Word"
            },
            "suffix": [
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
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue('something\n');
      newState = interpretScript(incomingState);
    });

    it('assigns the output of the sub-shell into that parameter in shell scope', () => {
      expect(fakeCommand).toBeCalledWith({}, ['asvalue']);
    });
  });
  describe('given consecutive commands (two interpreter calls), those commands can share state', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "prefix": [
              {
                "text": "a=asvalue",
                "type": "AssignmentWord"
              }
            ]
          }
        ]
      },
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue('something\n');
      newState = interpretScript(incomingState);
      newState.parserOutput = {
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
              }
            ]
          }
        ]
      };
      interpretScript(newState);
    });

    it('assigns the output of the sub-shell into that parameter in shell scope', () => {
      expect(fakeCommand).toBeCalledWith({}, ['asvalue']);
    });
  });
});