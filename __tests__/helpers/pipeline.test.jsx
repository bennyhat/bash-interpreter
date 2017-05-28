import {configuration} from '../../src/bash-interpreter';
import {interpretPipeline} from '../../src/helpers/pipeline';

describe('pipeline', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    configuration.functionMaps.command = {
      'fakeCommand': fakeCommand
    };
  });

  describe('#interpretLogicalExpression() given pipeline of commands', () => {
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
              "text": "something",
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
              "text": "something",
              "type": "Word"
            }
          ]
        }
      ]
    };
    const state = {
      exportedScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let output = {};

    beforeEach(() => {
      fakeCommand.mockReturnValueOnce({
        stdout: 'first stdout',
        stderr: 'first stderr',
        exitCode: 1
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'second stdout',
        stderr: 'second stderr',
        exitCode: 0
      });
      output = interpretPipeline(pipeline, state);
    });

    it('calls the command twice', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(2);
    });
    it('returns the output of both the commands', () => {
      expect(output).toEqual([
        {
          stdout: 'first stdout',
          stderr: 'first stderr',
          exitCode: 1
        },
        {
          stdout: 'second stdout',
          stderr: 'second stderr',
          exitCode: 0
        }
      ]);
    });
  });
});