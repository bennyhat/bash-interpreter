let outgoingState = {
  interpreterState: {
    shellScope: {},
    commandScope: {}
  }
};

function generateAssignmentMap(assignmentList = []) {
  let assignmentMap = {};
  assignmentList.forEach((assignment) => {
    const splitAssignment = assignment.text.split('=');
    assignmentMap[splitAssignment[0]] = splitAssignment[1];
  });
  return assignmentMap;
}

function expandVariables(originalText, expansionList = [], scopeList = []) {
  let replacementAdjustment = 0;

  return expansionList.reduce((resultingText, expansion) => {
    const expansionParameter = expansion.parameter;
    const replacementStart = expansion.loc.start - replacementAdjustment;
    const replacementEnd = expansion.loc.end - replacementAdjustment + 1;
    const replacementLength = expansion.loc.end - expansion.loc.start;

    const scope = scopeList.find((scope) => {
        return expansionParameter in scope;
      }) || {[expansionParameter]: ''};

    const expandedText = scope[expansionParameter];

    resultingText =
      resultingText.slice(0, replacementStart) +
      expandedText +
      resultingText.slice(replacementEnd);

    replacementAdjustment += replacementLength;

    return resultingText;
  }, originalText);
}

const commandToFunctionMap = {
  'noop': () => {
  },
  'assign': (prefixes, ignored, assignmentScope) => {
    let assignmentMap = generateAssignmentMap(prefixes);
    Object.assign(assignmentScope, assignmentScope, assignmentMap);
  },
  'echo': (prefixes, suffixes) => {
    outgoingState.interpreterOutput = suffixes.map((suffix) => {
        return expandVariables(suffix.text, suffix.expansion, [outgoingState.interpreterState.shellScope]);
      }).join(' ') + '\n';
  }
};
const tokenToFunctionMap = {
  'Command': (name, prefixes, suffixes) => {
    let commandName = 'noop';
    let assignmentScope = outgoingState.interpreterState.shellScope;
    if (typeof name === 'object') {
      commandName = name.text;
      assignmentScope = outgoingState.interpreterState.commandScope;
    }
    commandToFunctionMap['assign'](prefixes, suffixes, assignmentScope);
    commandToFunctionMap[commandName](prefixes, suffixes);
  }
};

module.exports = function bashInterpreter(incomingState) {
  const parserOutput = incomingState.parserOutput;
  Object.assign(outgoingState, outgoingState, incomingState); // TODO - this is not a deep copy

  parserOutput.commands.forEach((command) => {
    tokenToFunctionMap[command.type](command.name, command.prefix, command.suffix);
  });
  return outgoingState;
};