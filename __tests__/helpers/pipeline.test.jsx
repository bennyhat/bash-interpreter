import {configuration} from '../../src/bash-interpreter';
import {interpretPipeline} from '../../src/helpers/pipeline';
import BlockFile from '../../src/helpers/block-file';

// TODO - tests to make sure that commands only get a copy of the state (really, need to implement sub-shell first)
describe('pipeline', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    configuration.commandTypeMap.Command = fakeCommand;
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
      fileDescriptors: {
        stdin: new BlockFile()
      },
      exportedScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let output = {};
    let calledStdIns = [];

    beforeEach(() => {
      fakeCommand.mockImplementation((command, state) => {
        calledStdIns.push(state.fileDescriptors.stdin);
        return [{
          stdout: `${command.suffix[0].text} stdout`,
          stderr: `${command.suffix[0].text} stderr`,
          exitCode: 0
        }];
      });
      output = interpretPipeline(pipeline, state);
    });

    it('calls the command three times', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
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
    it('passes an empty stdin to the first command', () => {
      expect(calledStdIns[0].read()).toEqual(null);
    });
    it('passes the stdout of the first command into the second command', () => {
      expect(calledStdIns[1].read()).toEqual('first stdout');
    });
    it('passes the stdout of the second command into the third command', () => {
      expect(calledStdIns[2].read()).toEqual('second stdout');
    });
    it('leaves the stdin as the stdout of the third command in case this command has further piping', () => {
      expect(state.fileDescriptors.stdin.read()).toEqual('third stdout');
    });
  });
});