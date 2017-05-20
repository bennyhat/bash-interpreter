import fs from '../helpers/fs'
import bashParser from 'bash-parser';
import {interpretScript} from '../interpret-script';
import {copyAndMergeState} from '../helpers/state';

function generateParameterState(parameterList) {
  return parameterList.reduce((parameterState, parameter, index) => {
    parameterState[index] = parameter;
    return parameterState;
  },{});
}
export default function bash(environment, parameterList = []) {
  if (parameterList.length < 1) return 'ERROR: interactive bash not supported';
  let scriptFilePath = parameterList[0];
  try {
    let scriptFileContents = fs.readFileSync(scriptFilePath);
    let parsedOutput = bashParser(scriptFileContents);

    let parameterState = generateParameterState(parameterList);
    let incomingState = {
      parserOutput: parsedOutput,
      interpreterState: {
        shellScope: copyAndMergeState(environment, parameterState)
      }
    };
    let interpreterOutput = interpretScript(incomingState);
    return interpreterOutput.interpreterOutput;
  }
  catch (exception) {
    return `ERROR: error interpreting ${scriptFilePath}`;
  }
}