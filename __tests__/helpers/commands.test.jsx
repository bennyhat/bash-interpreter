jest.mock('../../src/helpers/parameters');
jest.mock('../../src/bash-interpreter');

import {assignParameters, expandParameter} from '../../src/helpers/parameters';
import {interpretCommand, expandCommand} from '../../src/helpers/commands';
import {bashInterpreter, configuration} from '../../src/bash-interpreter';

describe('commands', () => {
  let fakeCommand = jest.fn();
  let fakeBash = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    fakeBash.mockReset();
    expandParameter.mockReset();
    assignParameters.mockReset();
    bashInterpreter.mockReset();
    configuration.functionMaps = {
      command: {
        'fakeCommand': fakeCommand
      },
      builtin: {
        'bash': fakeBash
      }
    }
  });

  describe('#expandCommand() given a command expansion', () => {
    const expansion =
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
      };

    const state = {
      exportedScope: {
        'b': 'c'
      },
      shellScope: {
        'd': 'e'
      }
    };
    let replacedText = '';
    let passedState = {};

    beforeEach(() => {
      bashInterpreter.mockImplementation((state) => {
        passedState = state.interpreterState;
        return {
          interpreterOutput: 'something\n'
        };
      });
      replacedText = expandCommand(expansion, state);
    });

    it('calls the bash interpreter with the command AST for the expansion', () => {
      expect(bashInterpreter).toBeCalledWith({
        interpreterState: state,
        parserOutput: expansion.commandAST
      })
    });
    it('passes a copy of the state into the interpreter', () => {
      expect(passedState).toEqual(state);
      expect(passedState === state).toEqual(false);
    });
    it('returns a trimmed version of the interpreter output for the sub-shell command', () => {
      expect(replacedText).toEqual('something');
    });
  });
  describe('#expandCommand() given a command expansion with a variable and a state', () => {
    const expansion = {
      "loc": {
        "start": 0,
        "end": 16
      },
      "command": "fakeCommand $a",
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
      }
    };

    const state = {
      exportedScope: {
        'b': 'c'
      },
      shellScope: {
        'd': 'e'
      }
    };

    let replacedText = '';

    beforeEach(() => {
      bashInterpreter.mockReturnValue({
        interpreterOutput: 'something\n'
      });
      replacedText = expandCommand(expansion, state);
    });

    it('calls the bash interpreter with the command AST for the expansion', () => {
      expect(bashInterpreter).toBeCalledWith({
        interpreterState: state,
        parserOutput: expansion.commandAST
      })
    });
    it('returns a trimmed version of the interpreter output for the sub-shell command', () => {
      expect(replacedText).toEqual('something');
    });
  });

  describe('#interpretCommand() given a command with only an assignment', () => {
    const command = {
      "type": "Command",
      "prefix": [
        {
          "text": "a=b",
          "type": "AssignmentWord"
        }
      ]
    };
    let state = {
      shellScope: {}
    };
    let output = {};

    beforeEach(() => {
      output = interpretCommand(command, state);
    });

    it('calls the assign parameter method with the assignment and the scope', () => {
      expect(assignParameters).toBeCalledWith(command.prefix, state, 'shellScope');
    });
    it('returns a successful exit output (as multiple for compatibility)', () => {
      expect(output).toEqual([{
        stdout: '',
        stderr: '',
        exitCode: 0
      }]);
    });
  });
  describe('#interpretCommand() given a command that calls a fake command', () => {
    const command = {
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
    };
    let state = {};
    let output = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue({
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 1
      });
      output = interpretCommand(command, state);
    });

    it('calls the fake command', () => {
      expect(fakeCommand).toBeCalledWith({}, ['a literal string']);
    });
    it('returns the output of that command', () => {
      expect(output).toEqual([{
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 1
      }]);
    });
  });
  describe('#interpretCommand() given a command that calls a fake command and has an assignment', () => {
    const command = {
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
    };
    let state = {
      shellScope: {},
      commandScope: {}
    };
    let output = {};

    beforeEach(() => {
      fakeCommand.mockReturnValue({
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 1
      });
      assignParameters.mockImplementation((assignmentList, state) => {
        state.commandScope['a'] = 'b';
      });
      output = interpretCommand(command, state);
    });

    it('calls the assign parameter method with the assignment and the scope', () => {
      expect(assignParameters).toBeCalledWith(command.prefix, state, 'commandScope');
    });
    it('calls the fake command with the assigned values in its environment', () => {
      expect(fakeCommand).toBeCalledWith({'a': 'b'}, ['something']);
    });
    it('returns the output of that command', () => {
      expect(output).toEqual([{
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 1
      }]);
    });
  });
  describe('#interpretCommand() given a command containing a slash and arguments', () => {
    const command = {
      "type": "Command",
      "name": {
        "text": "./script-file",
        "type": "Word"
      },
      "suffix": [
        {
          "text": "something",
          "type": "Word"
        },
        {
          "text": "else",
          "type": "Word"
        }
      ]
    };
    let state = {
      shellScope: {},
      commandScope: {}
    };
    let output = {};

    beforeEach(() => {
      output = interpretCommand(command, state);
    });

    it('calls the fake bash command (as a builtin) with the script file and its arguments', () => {
      expect(fakeBash).toBeCalledWith(state, ['./script-file', 'something', 'else']);
    });
  });
  describe('#interpretCommand() given a command name that requires expansion', () => {
    const command = {
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
    };
    let state = {
      shellScope: {
        'script_var': 'fakeCommand'
      },
      commandScope: {}
    };
    let output = {};

    beforeEach(() => {
      expandParameter.mockReturnValue('fakeCommand');
      output = interpretCommand(command, state);
    });

    it('calls the fake command that comes from the expansion', () => {
      expect(fakeCommand).toBeCalledWith({}, ['something']);
    });
  });
});