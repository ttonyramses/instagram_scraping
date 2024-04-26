import { program } from 'commander';
import * as main from './main';

program
  .version('0.1.0')
  .command('get_profil_data')
  .description('Get all profile data from one Instagram user or many users')
  .option('-u, --users <user>', 'Add a user to the scrape list', collect, [])
  .action((option) => {
    if (option.users.length > 0) {
      
        console.log(`Processing profile data for users:`);
        main.get_profil_data(options.users); // Assuming get_profil_data can be called for each user
      
    } else {
      console.log('No users specified, scraping default set');
      // Handle the case where no users are specified
      main.get_profil_data();
    }
  });

function collect(value, previous) {
  return previous.concat(value);
}

program.parse(process.argv);