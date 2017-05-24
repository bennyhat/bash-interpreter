import {expandParameter} from './parameters';
import {expandCommand} from './commands';

function expandText(originalText, expansionList = [], scopeList = []) {
  let replacementAdjustment = 0;

  return expansionList.reduce((resultingText, expansion) => {
    const expansionParameter = expansion.parameter;
    const replacementStart = expansion.loc.start - replacementAdjustment;
    const replacementEnd = expansion.loc.end - replacementAdjustment + 1;
    const replacementLength = expansion.loc.end - expansion.loc.start;

    let expandedText = '';
    if (expansion.type === 'ParameterExpansion') {
      expandedText = expandParameter(scopeList, expansionParameter);
    } else if (expansion.type === 'CommandExpansion') {
      expandedText = expandCommand(expansion);
    }

    resultingText =
      resultingText.slice(0, replacementStart) +
      expandedText +
      resultingText.slice(replacementEnd);

    replacementAdjustment += replacementLength;

    return resultingText;
  }, originalText);
}

function expandTextBlocks(suffixes, state) {
  return suffixes.map((suffix) => {
    return expandText(suffix.text, suffix.expansion, [state.shellScope]);
  }).filter((expandedSuffix) => {
    return expandedSuffix !== '';
  });
}

export {expandTextBlocks};