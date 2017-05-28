import {configuration} from '../../src/bash-interpreter';
import {expandTextBlocks} from '../../src/helpers/expansion';

describe('expansion', () => {
  let fakeCommand = jest.fn();
  beforeEach(() => {
    fakeCommand.mockReset();
    configuration.functionMaps.command = {
      'fakeCommand': fakeCommand
    }
  });

  describe('#expandTextBlocks() given a command with parameter expansions, and an interpreter state', () => {
    const command =
      {
        "type": "Command",
        "name": {
          "text": "$command_var",
          "expansion": [
            {
              "loc": {
                "start": 0,
                "end": 11
              },
              "parameter": "command_var",
              "type": "ParameterExpansion"
            }
          ],
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
      };
    const state = {
      shellScope: {
        'command_var': 'expandedCommand',
        'c': 'g',
        'd': 'h'
      }
    };
    let expandedCommand = '';

    beforeEach(() => {
      expandedCommand = expandTextBlocks(command, state);
    });

    it('returns a command that has expansions replace with literals', () => {
      expect(expandedCommand).toEqual({
        "type": "Command",
        "name": {
          "text": "expandedCommand",
          "type": "Word"
        },
        "suffix": [
          {
            "text": "gsomethingh",
            "type": "Word"
          }
        ]
      });
    });
  });
  describe('#expandTextBlocks() given a command with command expansions, and an interpreter state', () => {
    const command = {
      "type": "Command",
      "fileDescriptors": {
        "stdin": "some stdin"
      },
      "name": {
        "text": "$(fakeCommand something)",
        "expansion": [
          {
            "loc": {
              "start": 0,
              "end": 23
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
                      "text": "namey",
                      "type": "Word"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "type": "Word"
      },
      "suffix": [
        {
          "text": "$(fakeCommand something)",
          "expansion": [
            {
              "loc": {
                "start": 0,
                "end": 23
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
            }
          ],
          "type": "Word"
        }
      ]
    };
    const state = {
      shellScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let expandedCommand = '';

    beforeEach(() => {
      fakeCommand.mockReturnValueOnce({
        stdout: 'fakeCommand',
        stderr: '',
        exitCode: 0
      });
      fakeCommand.mockReturnValueOnce({
        stdout: 'other thing\n',
        stderr: '',
        exitCode: 0
      });
      expandedCommand = expandTextBlocks(command, state);
    });

    it('returns a command that has expansions replace with literals', () => {
      expect(expandedCommand).toEqual({
        "type": "Command",
        "fileDescriptors": {},
        "name": {
          "text": "fakeCommand",
          "type": "Word"
        },
        "suffix": [
          {
            "text": "other thing",
            "type": "Word"
          }
        ]
      });
    });
    it('passes the stdin of the command to command name expansion command', () => {
      expect(fakeCommand).toBeCalledWith({}, {stdin: "some stdin"}, ['namey']);
    });
    it('passes no file descriptors to the suffix expansion command', () => {
      expect(fakeCommand).toBeCalledWith({}, {}, ['something']);
    });
  });
  describe('#expandTextBlocks() given a command with command suffix expansion only, and an interpreter state', () => {
    const command = {
      "type": "Command",
      "fileDescriptors": {
        "stdin": "some stdin"
      },
      "name": {
        "text": "fakeCommand",
        "type": "Word"
      },
      "suffix": [
        {
          "text": "$(fakeCommand something)$(fakeCommand something)",
          "expansion": [
            {
              "loc": {
                "start": 0,
                "end": 23
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
            },
            {
              "loc": {
                "start": 24,
                "end": 47
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
            }
          ],
          "type": "Word"
        }
      ]
    };
    const state = {
      shellScope: {
        'c': 'g',
        'd': 'h'
      }
    };
    let expandedCommand = '';

    beforeEach(() => {
      fakeCommand.mockReturnValue({
        stdout: 'other thing\n',
        stderr: '',
        exitCode: 0
      });
      expandedCommand = expandTextBlocks(command, state);
    });

    it('returns a command that has expansions replace with literals', () => {
      expect(expandedCommand).toEqual({
        "type": "Command",
        "fileDescriptors": {},
        "name": {
          "text": "fakeCommand",
          "type": "Word"
        },
        "suffix": [
          {
            "text": "other thingother thing",
            "type": "Word"
          }
        ]
      });
    });
    it('passes the stdin of the command to the first suffix expansion command', () => {
      expect(fakeCommand).toBeCalledWith({}, {stdin: "some stdin"}, ['something']);
    });
    it('passes no stdin to the command in the second suffix expansion command', () => {
      expect(fakeCommand).toBeCalledWith({}, {}, ['something']);
    });
  });
});