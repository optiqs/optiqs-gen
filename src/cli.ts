import yargs from 'yargs'
import {fromFiles} from './lib'

const argv = yargs
  .option('type', {
    alias: 't',
    default: 'State',
    describe: 'The root state type name'
  })
  .boolean('tree')
  .describe('tree', 'Print the generated tree instead of the code')
  .usage('$0 <file>', 'Generate lenses from a state tree', () => {
    return yargs.positional('file', {
      describe: 'Entry point'
    })
  }).argv

const fileResults = fromFiles(yargs.argv._, argv.type)
fileResults.forEach(({fileName, statements, tree}) => {
  console.log('File name:', fileName)
  if (argv.tree) {
    console.log(JSON.stringify(tree, null, 2))
  } else {
    statements.forEach(statement => console.log(statement))
  }
})
