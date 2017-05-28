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

  describe('#interpertPipeline() given a pipeline and state', () => {
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

    it('calls both commands regardless of failure', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(2);
    });
    it('returns the output of both commands', () => {
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
    it('calls the first command with a blank stdin', () => {
      expect(fakeCommand).toBeCalledWith({"c": "g", "d": "h"}, {stdin: ''}, ['something']);
    });
    it('calls the second command with the stdout of the first command', () => {
      expect(fakeCommand).toBeCalledWith({"c": "g", "d": "h"}, {stdin: 'first stdout'}, ['something']);
    });
  });
});