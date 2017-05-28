import {expandParameter} from './parameters';
import {expandCommand} from './commands';
import {copyAndMergeState} from './state';

function expandText(suffix, state) {
  let originalText = suffix.text;
  let expansionList = suffix.expansion || [];
  let replacementAdjustment = 0;

  return {
    type: 'Word',
    text: expansionList.reduce((resultingText, expansion) => {
        const expansionParameter = expansion.parameter;
        const replacementStart = expansion.loc.start - replacementAdjustment;
        const replacementEnd = expansion.loc.end - replacementAdjustment + 1;
        const replacementLength = expansion.loc.end - expansion.loc.start;

        let expandedText = '';
        if (expansion.type === 'ParameterExpansion') {
          expandedText = expandParameter(expansionParameter, state);
        } else if (expansion.type === 'CommandExpansion') {
          expandedText = expandCommand(expansion, state);
        }
        const expandedTextLength = expandedText.length - 1;

        resultingText =
          resultingText.slice(0, replacementStart) +
          expandedText +
          resultingText.slice(replacementEnd);

        replacementAdjustment += replacementLength - expandedTextLength;

        return resultingText;
      },
      originalText)
  }
}

function expandTextBlocks(command, state) {
  let outgoingCommand = copyAndMergeState(command);
  let commandNameExpansion = outgoingCommand.name.expansion || [];
  outgoingCommand.name.expansion = commandNameExpansion.map((expansion) => {
    if(expansion.type === 'CommandExpansion') {
      expansion.fileDescriptors = outgoingCommand.fileDescriptors;
      outgoingCommand.fileDescriptors = {};
    }
    return expansion;
  });

  outgoingCommand.name = expandText(outgoingCommand.name, state);
  outgoingCommand.suffix = outgoingCommand.suffix.map((suffix) => {
    let suffixExpansion = suffix.expansion || [];
    suffix.expansion = suffixExpansion.map((expansion) => {
      if(expansion.type === 'CommandExpansion') {
        expansion.fileDescriptors = outgoingCommand.fileDescriptors;
        outgoingCommand.fileDescriptors = {};
      }
      return expansion;
    });

    return expandText(suffix, state);
  }).filter((expandedSuffix) => {
    return expandedSuffix !== '';
  });
  return outgoingCommand;
}

export {expandText, expandTextBlocks};