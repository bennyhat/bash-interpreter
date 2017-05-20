import fs from '../helpers/fs'
import bashParser from 'bash-parser';
import {interpretScript} from '../../src/interpret-script';

export default function bash(environment, parameterList = []) {
  if (parameterList.length < 1) return 'ERROR: interactive bash not supported';
  let scriptFilePath = parameterList[0];
  try {
    let scriptFileContents = fs.readFileSync(scriptFilePath);
    let parsedOutput = bashParser(scriptFileContents);
    let interpreterOutput = interpretScript({parserOutput: parsedOutput});
    return interpreterOutput.interpreterOutput;
  }
  catch(exception) {
    return `ERROR: error interpreting ${scriptFilePath}`;
  }
}