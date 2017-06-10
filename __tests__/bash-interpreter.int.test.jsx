import {bashInterpreter, configuration} from "../src/bash-interpreter";

describe('bashInterpreter integration', () => {
  let fakeCommand = jest.fn();
  let bash = jest.fn();
  let builtinExport = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    bash.mockReset();
    builtinExport.mockReset();

    bash.mockReturnValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    });

    configuration.functionMaps.command = {
      'fakeCommand': fakeCommand
    };
    configuration.functionMaps.builtin = {
      'export': builtinExport,
      'bash': bash
    };
  });

  describe('given a script with a fake command', () => {
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
      interpreterOutputPrintable: false,
      interpreterState: {
        fileDescriptors: {
          stdin: []
        },
        shellScope: {
          'c': 'd'
        },
        commandScope: {},
        exportedScope: {
          'y': 'z'
        }
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue({
        stdout: 'something\n',
        stderr: 'error stuff\n',
        exitCode: 0
      });
      newState = bashInterpreter(incomingState);
    });
    it('calls the fake command with the parts in the suffix', () => {
      expect(fakeCommand).toBeCalledWith(
        incomingState.interpreterState.exportedScope,
        incomingState.interpreterState.fileDescriptors,
        ['a literal string']
      );
    });
    it('returns the stdout of the fake command in the interpreter output (will make more sense when this streams)', () => {
      expect(newState.interpreterOutput[0].stdout).toEqual('something\n');
    });
    it('returns the stderr of the fake command in the interpreter output (will make more sense when this streams)', () => {
      expect(newState.interpreterOutput[0].stderr).toEqual('error stuff\n');
    });
    it('returns the exit code of the fake command in the interpreter output (will make more sense when this streams)', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(0);
    });
  });

  describe('given a script with an assignment', () => {
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
      newState = bashInterpreter(incomingState);
    });
    it('returns a blank stdout', () => {
      expect(newState.interpreterOutput[0].stdout).toEqual('');
    });
    it('returns a blank stderr', () => {
      expect(newState.interpreterOutput[0].stderr).toEqual('');
    });
    it('returns a 0 exit code', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(0);
    });
  });
  describe('given a script with an assignment and command', () => {
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
              }
            ]
          }
        ]
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        fileDescriptors: {
          stdin: []
        },
        shellScope: {
          'c': 'd'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = bashInterpreter(incomingState);
    });
    it('calls the fake command with whatever was expanded from the suffix', () => {
      expect(fakeCommand).toBeCalledWith({'a':'b'}, incomingState.interpreterState.fileDescriptors, ['something']);
    });
  });

  describe('given a script with an assignment and command with parameter expansion', () => {
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
      interpreterOutputPrintable: false,
      interpreterState: {
        fileDescriptors: {
          stdin: []
        },
        shellScope: {
          'c': 'd'
        },
        commandScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = bashInterpreter(incomingState);
    });

    it('calls the fake command with correct outcomes for assignment and extraction', () => {
      expect(fakeCommand).toBeCalledWith({'a': 'b'}, incomingState.interpreterState.fileDescriptors, ['something', 'd']);
    });
  });

  describe('given a script with a parameter export assignment', () => {
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
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = bashInterpreter(incomingState);
    });

    it('calls the export command with the current interpreter state', () => {
      expect(builtinExport).toBeCalledWith(incomingState.interpreterState, ['a=b'])
    });
  });

  describe('given consecutive commands', () => {
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
      interpreterOutputPrintable: false,
      interpreterState: {
        fileDescriptors: {
          stdin: []
        },
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue({
        stdout: 'fake stdout',
        stderr: 'fake stderr',
        exitCode: 1
      });
      newState = bashInterpreter(incomingState);
    });

    it('the commands share state (variables assignment gets picked up in next command)', () => {
      expect(fakeCommand).toBeCalledWith({}, incomingState.interpreterState.fileDescriptors, ['asvalue']);
    });
    it('returns a blank stdout and the fake command stdout', () => {
      expect(newState.interpreterOutput[0].stdout).toEqual('');
      expect(newState.interpreterOutput[1].stdout).toEqual('fake stdout');
    });
    it('returns a blank stderr and the fake command stderr', () => {
      expect(newState.interpreterOutput[0].stderr).toEqual('');
      expect(newState.interpreterOutput[1].stderr).toEqual('fake stderr');
    });
    it('returns a 0 exit code and the fake command exit code', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(0);
      expect(newState.interpreterOutput[1].exitCode).toEqual(1);
    });

  });
  describe('given consecutive scripts, those scripts can share state', () => {
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
      interpreterOutputPrintable: false,
      interpreterState: {
        fileDescriptors: {
          stdin: []
        },
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue({stdout: 'something\n'});

      newState = bashInterpreter(incomingState);
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
      bashInterpreter(newState);
    });

    it('assigns the output of the sub-shell into that parameter in shell scope', () => {
      expect(fakeCommand).toBeCalledWith({}, incomingState.interpreterState.fileDescriptors, ['asvalue']);
    });
  });

  describe('given a command containing a slash', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "name": {
              "text": "./script-file",
              "type": "Word"
            }
          }
        ]
      },
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
      newState = bashInterpreter(incomingState);
    });

    it('runs that file through the bash command', () => {
      expect(bash).toBeCalledWith({"commandScope": {}, "exportedScope": {"a": "b"}, "shellScope": {}}, ['./script-file']);
    });
  });
  describe('given a command containing a slash and arguments', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "name": {
              "text": "./script-file",
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
      },
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
      newState = bashInterpreter(incomingState);
    });

    it('runs that file through the bash command and passes it that argument', () => {
      expect(bash).toBeCalledWith({"commandScope": {}, "exportedScope": {"a": "b"}, "shellScope": {}}, ['./script-file', 'something']);
    });
  });
  describe('given a command containing a slash that comes from expansion', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "Command",
            "name": {
              "text": "${script_var}",
              "expansion": [
                {
                  "loc": {
                    "start": 0,
                    "end": 12
                  },
                  "parameter": "script_var",
                  "type": "ParameterExpansion"
                }
              ],
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
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {
          'script_var': './script-file'
        },
        commandScope: {},
        exportedScope: {
          'a': 'b'
        }
      }
    };
    let newState = {};

    beforeEach(() => {
      newState = bashInterpreter(incomingState);
    });

    it('runs that file through the bash command and passes it that argument', () => {
      expect(bash).toBeCalledWith({"commandScope": {}, "exportedScope": {"a": "b"}, "shellScope": {"script_var": "./script-file"}}, ['./script-file', 'something']);
    });
  });

  describe('given multiple commands that are "AND"ed together', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "LogicalExpression",
            "op": "and",
            "left": {
              "type": "LogicalExpression",
              "op": "and",
              "left": {
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
              },
              "right": {
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
            },
            "right": {
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
          }
        ]
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockReset();
      fakeCommand
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        })
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        })
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure\n',
          exitCode: 1
        });
      newState = bashInterpreter(incomingState);
    });
    it('returns the stderr or stdout for all commands', () => {
      expect(newState.interpreterOutput[0].stdout).toEqual('something');
      expect(newState.interpreterOutput[1].stdout).toEqual('something');
      expect(newState.interpreterOutput[2].stderr).toEqual('failure\n');
    });
    it('returns the exit codes for all commands', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(0);
      expect(newState.interpreterOutput[1].exitCode).toEqual(0);
      expect(newState.interpreterOutput[2].exitCode).toEqual(1);
    });
    it('calls the fake command three times',()=> {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
    });
  });
  describe('given multiple commands that are "OR"ed together', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "LogicalExpression",
            "op": "or",
            "left": {
              "type": "LogicalExpression",
              "op": "or",
              "left": {
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
              },
              "right": {
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
            },
            "right": {
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
          }
        ]
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockClear();
      fakeCommand.mockReset();
      fakeCommand
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure',
          exitCode: 1
        })
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure',
          exitCode: 1
        })
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        });
      newState = bashInterpreter(incomingState);
    });
    it('returns the stderr or stdout for all commands', () => {
      expect(newState.interpreterOutput[0].stderr).toEqual('failure');
      expect(newState.interpreterOutput[1].stderr).toEqual('failure');
      expect(newState.interpreterOutput[2].stdout).toEqual('something');
    });
    it('returns the exit codes for all commands', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(1);
      expect(newState.interpreterOutput[1].exitCode).toEqual(1);
      expect(newState.interpreterOutput[2].exitCode).toEqual(0);
    });
    it('calls the fake command three times',()=> {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
    });
  });
  describe('given multiple commands that are "AND"ed and "OR"ed together', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "LogicalExpression",
            "op": "or",
            "left": {
              "type": "LogicalExpression",
              "op": "and",
              "left": {
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
              },
              "right": {
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
            },
            "right": {
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
          }
        ]
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockClear();
      fakeCommand.mockReset();
      fakeCommand
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        })
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure',
          exitCode: 1
        })
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        });
      newState = bashInterpreter(incomingState);
    });
    it('returns the stderr or stdout for all commands', () => {
      expect(newState.interpreterOutput[0].stdout).toEqual('something');
      expect(newState.interpreterOutput[1].stderr).toEqual('failure');
      expect(newState.interpreterOutput[2].stdout).toEqual('something');
    });
    it('returns the exit codes for all commands', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(0);
      expect(newState.interpreterOutput[1].exitCode).toEqual(1);
      expect(newState.interpreterOutput[2].exitCode).toEqual(0);
    });
    it('calls the fake command three times',()=> {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
    });
  });
  describe('given multiple commands that are "OR"ed and "AND"ed together', () => {
    let incomingState = {
      parserOutput: {
        "type": "Script",
        "commands": [
          {
            "type": "LogicalExpression",
            "op": "and",
            "left": {
              "type": "LogicalExpression",
              "op": "or",
              "left": {
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
              },
              "right": {
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
            },
            "right": {
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
          }
        ]
      },
      interpreterOutputPrintable: false,
      interpreterState: {
        shellScope: {},
        commandScope: {},
        exportedScope: {}
      }
    };
    let newState = {};

    beforeEach(() => {
      fakeCommand.mockClear();
      fakeCommand.mockReset();
      fakeCommand
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure',
          exitCode: 1
        })
        .mockReturnValueOnce({
          stdout: '',
          stderr: 'failure',
          exitCode: 1
        })
        .mockReturnValueOnce({
          stdout: 'something',
          stderr: '',
          exitCode: 0
        });
      newState = bashInterpreter(incomingState);
    });
    it('returns the stderr or stdout for all commands', () => {
      expect(newState.interpreterOutput[0].stderr).toEqual('failure');
      expect(newState.interpreterOutput[1].stderr).toEqual('failure');
    });
    it('returns the exit codes for all commands', () => {
      expect(newState.interpreterOutput[0].exitCode).toEqual(1);
      expect(newState.interpreterOutput[1].exitCode).toEqual(1);
    });
    it('calls the fake command three times',()=> {
      expect(fakeCommand).toHaveBeenCalledTimes(2);
    });
  });
});