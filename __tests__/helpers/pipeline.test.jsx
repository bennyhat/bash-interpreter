import {configuration} from '../../src/bash-interpreter';
import {interpretPipeline} from '../../src/helpers/pipeline';

describe('pipeline', () => {
  let fakeCommand = jest.fn();
  let fakeSubShell = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    fakeSubShell.mockReset();
    configuration.commandTypeMap.Command = fakeCommand;
    configuration.commandTypeMap.Subshell = fakeSubShell;
  });

  describe('#interpretPipeline() given pipeline of commands', () => {
    const pipeline = {
      "type": "Pipeline",
      "commands": [
        {
          "type": "Command",
          "name": {
            "text": "fakeCommand",
            "type": "Word"
          },
          "suffix": [
            {
              "text": "first",
              "type": "Word"
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
              "text": "second",
              "type": "Word"
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
              "text": "third",
              "type": "Word"
            }
          ]
        }
      ]
    };
    const state = {
      fileDescriptors: {},
      exportedScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let output = {};
    let calledStdIns = [];

    beforeEach(() => {
      calledStdIns = [];
      state.fileDescriptors = {stdin: ['stdin from somewhere']};
      fakeSubShell.mockImplementation((subShell, state) => {
        calledStdIns.push(state.fileDescriptors.stdin);
        return [[{
          stdout: `${subShell.list.commands[0].suffix[0].text} stdout`,
          stderr: `${subShell.list.commands[0].suffix[0].text} stderr`,
          exitCode: 0
        }]];
      });
      output = interpretPipeline(pipeline, state);
    });

    it('calls the command three times', () => {
      expect(fakeSubShell).toHaveBeenCalledTimes(3);
    });
    it('returns the output of all the commands', () => {
      expect(output).toEqual([
        {
          stdout: 'first stdout',
          stderr: 'first stderr',
          exitCode: 0
        },
        {
          stdout: 'second stdout',
          stderr: 'second stderr',
          exitCode: 0
        },
        {
          stdout: 'third stdout',
          stderr: 'third stderr',
          exitCode: 0
        }
      ]);
    });
    it('passes a reference to the outside stdin to the first command', () => {
      expect(calledStdIns[0].shift()).toEqual('stdin from somewhere');
      expect(state.fileDescriptors.stdin).toEqual([]);
    });
    it('passes only the stdout of the first command into the second command', () => {
      expect(calledStdIns[1].shift()).toEqual('first stdout');
      expect(calledStdIns[1].shift()).toEqual(undefined);
    });
    it('passes only the stdout of the second command into the third command', () => {
      expect(calledStdIns[2].shift()).toEqual('second stdout');
      expect(calledStdIns[2].shift()).toEqual(undefined);
    });
    it('does NOT mutate the value of the passed stdin at all (sub-shells can, but not it)', () => {
      expect(state.fileDescriptors.stdin).toEqual(['stdin from somewhere']);
    });
    it('passes the commands through a sub-shell', () => {
      expect(fakeSubShell).toBeCalledWith(
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
            "commands": [
              pipeline.commands[0]
            ]
          }
        },
        {
          fileDescriptors: {
            stdin: ['stdin from somewhere']
          },
          exportedScope: {
            'c': 'g',
            'd': 'h'
          }
        });
      expect(fakeSubShell).toBeCalledWith(
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
            "commands": [
              pipeline.commands[1]
            ]
          }
        },
        {
          fileDescriptors: {
            stdin: ['first stdout']
          },
          exportedScope: {
            'c': 'g',
            'd': 'h'
          }
        });
      expect(fakeSubShell).toBeCalledWith(
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
            "commands": [
              pipeline.commands[2]
            ]
          }
        },
        {
          fileDescriptors: {
            stdin: ['second stdout']
          },
          exportedScope: {
            'c': 'g',
            'd': 'h'
          }
        });
    });
  });
  describe('#interpretPipeline() given pipeline of sub-shells', () => {
    const pipeline = {
      "type": "Pipeline",
      "commands": [
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
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
        },
        {
          "type": "Subshell",
          "list": {
            "type": "CompoundList",
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
      ]
    };
    const state = {
      fileDescriptors: {
        stdin: []
      },
      exportedScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let output = {};

    beforeEach(() => {
      fakeSubShell.mockReturnValue([[{
        stdout: 'stdout',
        stderr: 'stderr',
        exitCode: 0
      }]]);
      output = interpretPipeline(pipeline, state);
    });

    it('does not wrap sub-shells in sub-shells', () => {
      expect(fakeSubShell).toBeCalledWith(
        pipeline.commands[0],
        state
      );
      expect(fakeSubShell).toBeCalledWith(
        pipeline.commands[1],
        state
      );
    });
  });
});