import {writeFileSync} from 'fs'
import yargs from 'yargs'
import {fromFiles} from './lib'

const argv = yargs
  .option('type', {
    alias: 't',
    default: 'State',
    describe: 'The root state type name'
  })
  .option('output', {
    alias: 'o',
    describe: 'File to write output to. Defaults to stdout',
    default: ''
  })
  .boolean('tree')
  .describe('tree', 'Print the generated tree instead of the code')
  .usage('$0 <file>', 'Generate lenses from a state tree', () => {
    return yargs.positional('file', {
      describe: 'Entry point'
    })
  }).argv

const fileResults = fromFiles(yargs.argv._, argv.type)
fileResults.forEach(({statements, tree}) => {
  let result = ''
  if (argv.tree) {
    result = JSON.stringify(tree, null, 2)
  } else {
    result = statements.join('\n')
  }

  if (argv.output) {
    writeFileSync(argv.output, result)
  } else {
    console.log(result)
  }
})
