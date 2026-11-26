import bcrypt from 'bcrypt';

const pw = process.argv[2];
if (!pw) {
  console.error('Pakai: npx tsx src/hash.ts <password>');
  process.exit(1);
}
console.log(await bcrypt.hash(pw, 10));