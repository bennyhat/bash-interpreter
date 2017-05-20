jest.mock('../src/helpers/parameters');
jest.mock('../src/helpers/expansion');
jest.mock('../src/builtins/export');

import {interpretScript, configuration} from "../src/interpret-script";
import {assignParameters} from '../src/helpers/parameters';
import {expandText} from '../src/helpers/expansion';
import builtinExport from '../src/builtins/export';

describe('interpretScript', () => {
  let fakeCommand = jest.fn();

  beforeEach(() => {
    fakeCommand.mockClear();
    assignParameters.mockClear();
    expandText.mockClear();
    builtinExport.mockClear();
    expandText.mockImplementation((text) => text);

    configuration.functionMaps.command = {'fakeCommand': fakeCommand}
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
      interpreterOutput: '',
      interpreterOutputPrintable: false,
      interpreterState: {
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
      newState = interpretScript(incomingState);
    });
    it('calls the expand parameters function for the parameter text, even with no expansions', () => {
      expect(expandText).toBeCalledWith('a literal string', undefined, [incomingState.interpreterState.shellScope]);
    });
    it('calls the fake command with the parts in the suffix', () => {
      expect(fakeCommand).toBeCalledWith(incomingState.interpreterState.exportedScope, ['a literal string']);
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
    it('uses the parameters module assignParameters function to do the assignment into command scope', () => {
      expect(assignParameters).toBeCalledWith(
        incomingState.parserOutput.commands[0].prefix,
        incomingState.interpreterState.shellScope,
        incomingState.interpreterState.shellScope);
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
    it('uses the parameters module assignParameters function to do the assignment into command scope', () => {
      expect(assignParameters).toBeCalledWith(
        incomingState.parserOutput.commands[0].prefix,
        incomingState.interpreterState.shellScope,
        incomingState.interpreterState.commandScope);
    });
    it('calls the fake command with whatever was expanded from the suffix', () => {
      expect(fakeCommand).toBeCalledWith({}, ['something']);
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
      assignParameters.mockImplementation((ignoredAssignments, ignoredFromScope, toScope) => toScope['a'] = 'b');
      expandText
        .mockReturnValueOnce('something')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('d');

      newState = interpretScript(incomingState);
    });

    it('calls the fake command with correct outcomes for assignment and extraction', () => {
      expect(fakeCommand).toBeCalledWith({'a': 'b'}, ['something', 'd']);
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

    it('calls the export command with the current interpreter state', () => {
      expect(builtinExport).toBeCalledWith(incomingState.interpreterState, ['a=b'])
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
      assignParameters.mockImplementation((assignmentList = [], ignoredFromScope, toScope) => {
        if (assignmentList.length > 0) {
          toScope['a'] = 'asvalue'
        }
      });
      expandText.mockReturnValue('asvalue');
      newState = interpretScript(incomingState);
    });

    it('assigns the output of the sub-shell into that parameter in shell scope', () => {
      expect(fakeCommand).toBeCalledWith({}, ['asvalue']);
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
      assignParameters.mockImplementation((assignmentList = [], ignoredFromScope, toScope) => {
        if (assignmentList.length > 0) {
          toScope['a'] = 'asvalue'
        }
      });
      expandText.mockReturnValue('asvalue');

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