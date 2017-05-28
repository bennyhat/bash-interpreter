import {configuration} from '../../src/bash-interpreter';
import {interpretLogicalExpression} from '../../src/helpers/logical-expression';

describe('logicalExpression', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockReset();
    configuration.functionMaps.command = {
      'fakeCommand': fakeCommand
    };
  });

  describe('#interpretLogicalExpression() given an AND expression (failing left side) and an interpreter state', () => {
    const expression = {
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
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      });
      output = interpretLogicalExpression(expression, state);
    });

    it('calls the command only once (does not run right side)', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(1);
    });
    it('returns the output of the failed command', () => {
      expect(output).toEqual([{
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      }]);
    });
  });
  describe('#interpretLogicalExpression() given an OR expression (failing left side) and an interpreter state', () => {
    const expression = {
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
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      output = interpretLogicalExpression(expression, state);
    });

    it('calls the fake command twice', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(2);
    });
    it('returns the output of the both commands', () => {
      expect(output).toEqual([
        {
          stdout: 'failed',
          stderr: 'failed',
          exitCode: 1
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        }]);
    });
  });
  describe('#interpretLogicalExpression() given an AND then OR expression (failing left side) and an interpreter state', () => {
    const expression = {
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
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      output = interpretLogicalExpression(expression, state);
    });

    it('calls the fake command twice', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(2);
    });
    it('returns the output of the first and last commands', () => {
      expect(output).toEqual([
        {
          stdout: 'failed',
          stderr: 'failed',
          exitCode: 1
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        }]);
    });
  });
  describe('#interpretLogicalExpression() given an OR then AND expression (failing left side) and an interpreter state', () => {
    const expression =  {
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
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      output = interpretLogicalExpression(expression, state);
    });

    it('calls the fake command three times', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
    });
    it('returns the output of the first and last commands', () => {
      expect(output).toEqual([
        {
          stdout: 'failed',
          stderr: 'failed',
          exitCode: 1
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        }]);
    });
  });
  describe('#interpretLogicalExpression() given an OR then AND expression (passing left side) and an interpreter state', () => {
    const expression =  {
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
        stdout: 'failed',
        stderr: 'failed',
        exitCode: 1
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'passed',
        stderr: 'passed',
        exitCode: 0
      });
      output = interpretLogicalExpression(expression, state);
    });

    it('calls the fake command three times', () => {
      expect(fakeCommand).toHaveBeenCalledTimes(3);
    });
    it('returns the output of the first and last commands', () => {
      expect(output).toEqual([
        {
          stdout: 'failed',
          stderr: 'failed',
          exitCode: 1
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        },
        {
          stdout: 'passed',
          stderr: 'passed',
          exitCode: 0
        }]);
    });
  });
});