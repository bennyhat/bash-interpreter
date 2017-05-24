import {flattenArray} from './state';
import {configuration} from '../bash-interpreter';

function interpretLogicalExpression(expression, state) {
  let leftCommand = expression.left;
  let rightCommand = expression.right;
  let operation = expression.op;

  let leftCommandOutput = flattenArray(configuration.commandTypeMap[leftCommand.type](leftCommand));
  if (leftCommandOutput[leftCommandOutput.length - 1].exitCode !== 0 &&
    operation === 'and') return leftCommandOutput;
  let rightCommandOutput = flattenArray(configuration.commandTypeMap[rightCommand.type](rightCommand, state));
  return [leftCommandOutput, rightCommandOutput];
}

export {interpretLogicalExpression};