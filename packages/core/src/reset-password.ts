/**
 * Password recovery CLI: `docker exec -it openmasjid-core node \
 *   packages/core/dist/reset-password.js`. Lets an admin who is locked out set
 * a new password from the machine's terminal. Apps and data are untouched.
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { isConfigured, getUsername, setCredentials } from './auth/store';
import { hashPassword, MIN_PASSWORD_LENGTH } from './auth/passwords';
import { destroyAllSessions } from './auth/sessions';

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  if (!isConfigured()) {
    stdout.write('\nNo admin account exists yet. Open the dashboard to create one.\n');
    rl.close();
    return;
  }

  const current = getUsername() ?? 'admin';
  stdout.write(`\nResetting the password for "${current}".\n`);
  const username = (await rl.question(`Username [${current}]: `)).trim() || current;

  let password = '';
  for (;;) {
    password = await rl.question('New password (typed visibly): ');
    if (password.length < MIN_PASSWORD_LENGTH) {
      stdout.write(`  Please use at least ${MIN_PASSWORD_LENGTH} characters.\n`);
      continue;
    }
    const confirm = await rl.question('Confirm new password: ');
    if (confirm !== password) {
      stdout.write("  Those didn't match — let's try again.\n");
      continue;
    }
    break;
  }

  setCredentials(username, await hashPassword(password));
  destroyAllSessions();
  stdout.write('\n✅ Password updated. You can sign in now.\n\n');
  rl.close();
}

main().catch((err) => {
  stdout.write(`\nSomething went wrong: ${(err as Error).message}\n`);
  process.exit(1);
});
